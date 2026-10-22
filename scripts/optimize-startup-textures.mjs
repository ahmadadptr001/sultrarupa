// Lossless delivery variants: original dimensions and decoded pixels stay exact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { EXTTextureWebP } from '@gltf-transform/extensions';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The lightweight logo reader expects contiguous attributes, not interleaving.
const io = new NodeIO().registerExtensions([EXTTextureWebP]).setVertexLayout(VertexLayout.SEPARATE);
const report = [];
async function lossless(input, name) {
  const result = await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
  const before = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const after = await sharp(result).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(after.info, before.info);
  assert.ok(after.data.equals(before.data), `${name}: decoded pixels changed`);
  assert.ok(result.length < input.length);
  report.push({ name, before: input.length, after: result.length,
    width: before.info.width, height: before.info.height, identicalPixels: true });
  return result;
}

const relative = 'models/munas-ix-logo-hd.glb';
const destination = path.join(root, 'public', relative);
const backup = path.join(root, 'backups/performance/pre-lossless', relative);
await fs.mkdir(path.dirname(backup), { recursive: true });
try { await fs.copyFile(destination, backup, fs.constants.COPYFILE_EXCL); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
const document = await io.readBinary(await fs.readFile(backup));
function geometryData(doc) {
  const data = new Map();
  doc.getRoot().listMeshes().forEach((mesh, m) => mesh.listPrimitives().forEach((primitive, p) => {
    for (const semantic of primitive.listSemantics()) {
      data.set(`${m}/${p}/${semantic}`, primitive.getAttribute(semantic).getArray());
    }
    data.set(`${m}/${p}/indices`, primitive.getIndices().getArray());
  }));
  return data;
}
const geometry = geometryData(document);
for (const texture of document.getRoot().listTextures()) {
  texture.setImage(await lossless(texture.getImage(), relative)).setMimeType('image/webp');
}
document.createExtension(EXTTextureWebP).setRequired(true);
const output = await io.writeBinary(document);
const decoded = await io.readBinary(output);
const afterGeometry = geometryData(decoded);
assert.equal(afterGeometry.size, geometry.size);
for (const [key, data] of geometry) {
  const after = afterGeometry.get(key);
  assert.equal(after.length, data.length);
  assert.ok(data.every((value, index) => value === after[index]), `Geometry values changed: ${key}`);
}
await fs.writeFile(destination, output);
await fs.mkdir(path.join(root, 'artifacts/performance'), { recursive: true });
await fs.writeFile(path.join(root, 'artifacts/performance/startup-lossless.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
