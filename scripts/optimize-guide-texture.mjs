// Lossless texture encoding only: geometry/Draco bytes and decoded pixels must match.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const filename = new URL('../public/models/culture/monument-guide.glb', import.meta.url);
const source = await fs.readFile(filename);
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.subarray(20, 20 + jsonLength));
const binary = source.subarray(28 + jsonLength);
const index = gltf.images.findIndex(image => image.mimeType === 'image/png');
if (index < 0) {
  console.log('Guide texture already optimized.');
} else {
  const image = gltf.images[index], imageView = image.bufferView;
  const views = gltf.bufferViews.map(view => Buffer.from(binary.subarray(view.byteOffset || 0,
    (view.byteOffset || 0) + view.byteLength)));
  const encoded = await sharp(views[imageView]).webp({ lossless: true, effort: 6 }).toBuffer();
  const before = await sharp(views[imageView]).raw().toBuffer({ resolveWithObject: true });
  const after = await sharp(encoded).raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(after.info, before.info);
  assert.ok(after.data.equals(before.data), 'Decoded texture pixels changed');
  assert.ok(encoded.length < views[imageView].length);
  const chunks = [];
  let offset = 0;
  for (const [i, view] of gltf.bufferViews.entries()) {
    assert.equal(view.buffer, 0);
    const bytes = i === imageView ? encoded : views[i];
    view.byteOffset = offset;
    view.byteLength = bytes.length;
    const padding = Buffer.alloc((4 - bytes.length % 4) % 4);
    chunks.push(bytes, padding);
    offset += bytes.length + padding.length;
  }
  const bin = Buffer.concat(chunks);
  for (const [i, view] of gltf.bufferViews.entries()) {
    if (i !== imageView) assert.ok(bin.subarray(view.byteOffset, view.byteOffset + view.byteLength).equals(views[i]));
  }
  image.mimeType = 'image/webp';
  for (const texture of gltf.textures) {
    if (texture.source !== index) continue;
    texture.extensions = { ...texture.extensions, EXT_texture_webp: { source: index } };
    delete texture.source;
  }
  for (const key of ['extensionsUsed', 'extensionsRequired']) gltf[key] = [...new Set([...(gltf[key] || []), 'EXT_texture_webp'])];
  gltf.buffers[0].byteLength = bin.length;
  const json = Buffer.from(JSON.stringify(gltf));
  const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + padded.length + bin.length, 8);
  header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binHeader.writeUInt32LE(bin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  const output = Buffer.concat([header, padded, binHeader, bin]);
  const backup = new URL('../backups/performance/pre-lossless/monument-guide.glb', import.meta.url);
  await fs.mkdir(new URL('.', backup), { recursive: true });
  await fs.writeFile(backup, source, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
  await fs.writeFile(filename, output);
  console.log(JSON.stringify({ before: source.length, after: output.length,
    saved: source.length - output.length, width: before.info.width, height: before.info.height,
    pixelsIdentical: true, geometryBytesIdentical: true }));
}
