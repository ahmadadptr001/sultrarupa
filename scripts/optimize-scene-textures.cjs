// Re-encode opaque baked textures, retaining every geometry byte and UV.
// Run with: node scripts/optimize-scene-textures.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS asset builder. */
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BACKUP = path.join(ROOT, 'backups/performance');
const ARTIFACTS = path.join(ROOT, 'artifacts/performance');
const FILES = [
  'models/opening-boat.glb',
  'models/culture/mekongga.glb',
  'models/culture/laika.glb',
  'models/culture/banua-tada.glb',
  'models/culture/bharugano-wuna.glb',
];
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const paddedLength = (length) => Math.ceil(length / 4) * 4;

function parseGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'Expected a GLB');
  assert.equal(bytes.readUInt32LE(4), 2, 'Expected glTF 2');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB length mismatch');
  const chunks = [];
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    assert.equal(length % 4, 0, 'Chunk must be aligned');
    assert.ok(offset + 8 + length <= bytes.length, 'Chunk outside container');
    chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(chunks[0].type, JSON_CHUNK);
  assert.equal(chunks.filter((chunk) => chunk.type === BIN_CHUNK).length, 1);
  const json = JSON.parse(chunks[0].data.toString('utf8'));
  const binary = chunks.find((chunk) => chunk.type === BIN_CHUNK).data;
  assert.equal(json.buffers.length, 1);
  assert.ok(!json.buffers[0].uri);
  assert.ok(binary.length >= json.buffers[0].byteLength);
  return { json, binary, chunks };
}

function packGlb(json, binary, chunks) {
  const encodedJson = Buffer.from(JSON.stringify(json));
  const outputChunks = chunks.map((chunk) => {
    const data = chunk.type === JSON_CHUNK ? encodedJson
      : chunk.type === BIN_CHUNK ? binary : chunk.data;
    const result = Buffer.alloc(8 + paddedLength(data.length), chunk.type === JSON_CHUNK ? 0x20 : 0);
    result.writeUInt32LE(result.length - 8, 0);
    result.writeUInt32LE(chunk.type, 4);
    data.copy(result, 8);
    return result;
  });
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + outputChunks.reduce((sum, chunk) => sum + chunk.length, 0), 8);
  return Buffer.concat([header, ...outputChunks]);
}

function viewBytes(glb, index) {
  const view = glb.json.bufferViews[index];
  return glb.binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
}

function validate(original, optimized, imageViews) {
  assert.equal(original.json.bufferViews.length, optimized.json.bufferViews.length);
  let unchangedViews = 0;
  optimized.json.bufferViews.forEach((view, index) => {
    assert.equal(view.buffer || 0, 0);
    assert.equal((view.byteOffset || 0) % 4, 0, 'Unaligned buffer view');
    assert.ok((view.byteOffset || 0) + view.byteLength <= optimized.json.buffers[0].byteLength);
    if (!imageViews.has(index)) {
      assert.equal(hash(viewBytes(original, index)), hash(viewBytes(optimized, index)), `Changed geometry view ${index}`);
      unchangedViews++;
    }
  });
  const before = structuredClone(original.json);
  const after = structuredClone(optimized.json);
  // Only binary offsets, image lengths/MIME types, and total buffer size may change.
  for (const json of [before, after]) {
    delete json.buffers[0].byteLength;
    json.bufferViews.forEach((view, index) => {
      delete view.byteOffset;
      if (imageViews.has(index)) delete view.byteLength;
    });
    json.images.forEach((image) => { if (imageViews.has(image.bufferView)) delete image.mimeType; });
  }
  assert.deepEqual(before, after, 'Unexpected change to model metadata');
  const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  for (const accessor of optimized.json.accessors || []) {
    if (accessor.bufferView === undefined) continue;
    assert.ok(!imageViews.has(accessor.bufferView), 'Image buffer also used as an accessor');
    const view = optimized.json.bufferViews[accessor.bufferView];
    const itemBytes = componentBytes[accessor.componentType] * components[accessor.type];
    const end = (accessor.byteOffset || 0) + (accessor.count - 1) * (view.byteStride || itemBytes) + itemBytes;
    assert.ok(end <= view.byteLength, 'Accessor outside buffer view');
  }
  return { unchangedGeometryViews: unchangedViews, accessorsChecked: optimized.json.accessors?.length || 0 };
}

async function optimize(relativePath) {
  const destination = path.join(ROOT, 'public', relativePath);
  const backup = path.join(BACKUP, relativePath);
  await fs.mkdir(path.dirname(backup), { recursive: true });
  try {
    await fs.copyFile(destination, backup, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  // Always regenerate from the first original, never recompress a prior JPEG.
  const source = await fs.readFile(backup);
  const original = parseGlb(source);
  const json = structuredClone(original.json);
  const replacements = [];
  for (let index = 0; index < json.images.length; index++) {
    const image = json.images[index];
    if (image.mimeType !== 'image/png' || image.bufferView === undefined) continue;
    const bytes = viewBytes(original, image.bufferView);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.hasAlpha, false, 'Only opaque textures may become JPEG');
    assert.equal(metadata.width, 2048);
    assert.equal(metadata.height, 2048);
    const jpeg = await sharp(bytes).jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer();
    const view = json.bufferViews[image.bufferView];
    const start = view.byteOffset || 0;
    const end = start + view.byteLength;
    for (const [otherIndex, other] of json.bufferViews.entries()) {
      if (otherIndex === image.bufferView) continue;
      const otherStart = other.byteOffset || 0;
      assert.ok(otherStart >= end || otherStart + other.byteLength <= start, 'Overlapping image buffer views');
    }
    // Keep each replacement delta divisible by four; retain all existing gaps.
    const padding = ((view.byteLength - jpeg.length) % 4 + 4) % 4;
    const replacement = Buffer.concat([jpeg, Buffer.alloc(padding)]);
    replacements.push({ viewIndex: image.bufferView, start, end, jpeg, replacement, source: bytes });
    image.mimeType = 'image/jpeg';
  }
  assert.equal(replacements.length, 1, 'Expected one opaque baked texture');
  replacements.sort((a, b) => a.start - b.start);
  const pieces = [];
  let cursor = 0;
  for (const replacement of replacements) {
    pieces.push(original.binary.subarray(cursor, replacement.start), replacement.replacement);
    cursor = replacement.end;
  }
  pieces.push(original.binary.subarray(cursor));
  const binary = Buffer.concat(pieces);
  json.bufferViews.forEach((view, index) => {
    const previousOffset = view.byteOffset || 0;
    const shift = replacements.filter((item) => item.end <= previousOffset)
      .reduce((sum, item) => sum + item.replacement.length - (item.end - item.start), 0);
    view.byteOffset = previousOffset + shift;
    const replacement = replacements.find((item) => item.viewIndex === index);
    if (replacement) view.byteLength = replacement.jpeg.length;
  });
  json.buffers[0].byteLength += binary.length - original.binary.length;
  const output = packGlb(json, binary, original.chunks);
  const checks = validate(original, parseGlb(output), new Set(replacements.map((item) => item.viewIndex)));
  await fs.writeFile(destination, output);
  if (relativePath.endsWith('/laika.glb')) {
    const originalPreview = await sharp(replacements[0].source).resize(768, 768).png().toBuffer();
    const optimizedPreview = await sharp(replacements[0].jpeg).resize(768, 768).png().toBuffer();
    await sharp({ create: { width: 1536, height: 768, channels: 3, background: '#ffffff' } })
      .composite([{ input: originalPreview, left: 0, top: 0 }, { input: optimizedPreview, left: 768, top: 0 }])
      .png().toFile(path.join(ARTIFACTS, 'laika-texture-before-after.png'));
  }
  return {
    file: relativePath, originalBytes: source.length, optimizedBytes: output.length,
    savedBytes: source.length - output.length,
    originalSha256: hash(source), optimizedSha256: hash(output),
    texture: { originalBytes: replacements[0].source.length, optimizedBytes: replacements[0].jpeg.length,
      width: 2048, height: 2048, quality: 88, chromaSubsampling: '4:4:4' },
    ...checks,
  };
}

async function main() {
  await fs.mkdir(ARTIFACTS, { recursive: true });
  const files = [];
  for (const relativePath of FILES) files.push(await optimize(relativePath));
  const report = {
    generatedAt: new Date().toISOString(),
    note: 'Geometry, UVs, accessors, indices, materials and animations unchanged. Preview: original left, optimized right.',
    originalBytes: files.reduce((sum, file) => sum + file.originalBytes, 0),
    optimizedBytes: files.reduce((sum, file) => sum + file.optimizedBytes, 0),
    savedBytes: files.reduce((sum, file) => sum + file.savedBytes, 0),
    files,
  };
  await fs.writeFile(path.join(ARTIFACTS, 'texture-optimization.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
