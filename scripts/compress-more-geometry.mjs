// Extends scripts/compress-scene-geometry.mjs to the remaining load-bearing GLBs
// that load through the app's draco-capable GLTFLoader. Same conservative
// quantization, same guarantees: textures/materials/transforms byte-identical,
// decoded geometry within quantization tolerance of the source surface.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco from 'draco3dgltf';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['player-anoa', 'player-anoa-accessories', 'player-anoa-native-accessories',
  'interiors/ruangan-kotak-besar', 'culture/sulawesi-intro', 'culture/sulawesi-island'];
const hash = (data) => createHash('sha256').update(data).digest('hex');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco.createEncoderModule(),
  'draco3d.decoder': await draco.createDecoderModule(),
});

function summary(document) {
  const scene = document.getRoot();
  return {
    nodes: scene.listNodes().map((node) => ({ name: node.getName(),
      translation: node.getTranslation(), rotation: node.getRotation(), scale: node.getScale(),
      extras: node.getExtras() })),
    animations: scene.listAnimations().map((animation) => ({
      name: animation.getName(),
      channels: animation.listChannels().map((channel) => ({
        node: channel.getTargetNode()?.getName(), path: channel.getTargetPath(),
        transform: channel.getSampler(), keyframes: hash(channel.getSampler().input.array),
      })),
      samplers: animation.listSamplers().map((sampler) => ({
        input: hash(sampler.input.array), output: hash(sampler.output.array),
        interpolation: sampler.getInterpolation(),
      })),
    })),
    textures: scene.listTextures().map((texture) => ({ name: texture.getName(),
      hash: hash(texture.getImage()), mime: texture.getMimeType(), size: texture.getSize() })),
    materials: scene.listMaterials().map((material) => ({ name: material.getName(),
      baseColor: material.getBaseColorFactor(), emissive: material.getEmissiveFactor(),
      roughness: material.getRoughnessFactor(), metallic: material.getMetallicFactor(),
      doubleSided: material.getDoubleSided(), alphaMode: material.getAlphaMode() })),
  };
}

function checkGeometry(before, after) {
  const a = before.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
  const b = after.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
  assert.equal(a.length, b.length);
  let triangles = 0, maxPositionError = 0, maxBoundsError = 0;
  for (let primitive = 0; primitive < a.length; primitive++) {
    const source = a[primitive].getAttribute('POSITION');
    const decoded = b[primitive].getAttribute('POSITION');
    const sourceIndices = a[primitive].getIndices()?.getCount() || source.getCount();
    const decodedIndices = b[primitive].getIndices()?.getCount() || decoded.getCount();
    assert.equal(sourceIndices, decodedIndices, 'Triangle count changed');
    assert.equal(a[primitive].getMode(), b[primitive].getMode());
    triangles += sourceIndices / 3;
    const lo = source.getMin([]), hi = source.getMax([]);
    const decodedLo = decoded.getMin([]), decodedHi = decoded.getMax([]);
    const extent = Math.max(...hi.map((value, i) => value - lo[i]));
    const tolerance = Math.max(extent / (2 ** 20 - 1) * 2.1, 0.000001);
    for (let axis = 0; axis < 3; axis++) {
      const error = Math.max(Math.abs(lo[axis] - decodedLo[axis]), Math.abs(hi[axis] - decodedHi[axis]));
      assert.ok(error <= tolerance, 'Bounds changed beyond quantization precision');
      maxBoundsError = Math.max(maxBoundsError, error);
    }
    const grid = new Map(), points = source.getArray(), output = decoded.getArray();
    const cell = (x, y, z) => `${x},${y},${z}`;
    for (let i = 0; i < points.length; i += 3) {
      const key = cell(Math.floor(points[i] / tolerance), Math.floor(points[i + 1] / tolerance), Math.floor(points[i + 2] / tolerance));
      const bucket = grid.get(key) || [];
      bucket.push(i); grid.set(key, bucket);
    }
    for (let i = 0; i < output.length; i += 3) {
      const x = output[i], y = output[i + 1], z = output[i + 2];
      const cx = Math.floor(x / tolerance), cy = Math.floor(y / tolerance), cz = Math.floor(z / tolerance);
      let nearest = Infinity;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        for (const j of grid.get(cell(cx + dx, cy + dy, cz + dz)) || []) {
          nearest = Math.min(nearest, Math.hypot(x - points[j], y - points[j + 1], z - points[j + 2]));
        }
      }
      assert.ok(nearest <= tolerance, `Decoded vertex outside source surface: ${nearest}`);
      maxPositionError = Math.max(maxPositionError, nearest);
    }
  }
  return { triangles, maxPositionError, maxBoundsError };
}

const reports = [];
const skipped = [];
for (const name of files) {
  const relative = `models/${name}.glb`;
  const destination = path.join(root, 'public', relative);
  const backup = path.join(root, 'backups/performance/pre-draco', relative);
  await fs.mkdir(path.dirname(backup), { recursive: true });
  try { await fs.copyFile(destination, backup, fs.constants.COPYFILE_EXCL); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const bytes = await fs.readFile(backup);
  try {
    const document = await io.readBinary(bytes);
    document.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
      method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
      encodeSpeed: 5, decodeSpeed: 5, quantizationVolume: 'mesh',
      quantizationBits: { POSITION: 20, NORMAL: 16, TEX_COORD: 20, COLOR: 16, GENERIC: 20 },
    });
    const compressed = await io.writeBinary(document);
    const started = performance.now();
    const decoded = await io.readBinary(compressed);
    const decodeMs = performance.now() - started;
    assert.deepEqual(summary(decoded), summary(document), 'Textures, materials, animations or node transforms changed');
    const geometry = checkGeometry(document, decoded);
    assert.ok(compressed.length < bytes.length, 'Compression must reduce download size');
    await fs.writeFile(destination, compressed);
    const report = { file: relative, before: bytes.length, after: compressed.length,
      gzipBefore: gzipSync(bytes).length, gzipAfter: gzipSync(compressed).length,
      decodeMs, texturesUnchanged: true, ...geometry };
    reports.push(report);
    console.log(JSON.stringify(report));
  } catch (error) {
    // Leave the original file untouched when strict guarantees cannot be met.
    skipped.push({ file: relative, reason: String(error && error.message || error) });
    console.log(JSON.stringify(skipped[skipped.length - 1]));
  }
}

const artifactPath = path.join(root, 'artifacts/performance/geometry-compression.json');
const existing = await fs.readFile(artifactPath, 'utf8').then(JSON.parse).catch(() => ({ quantizationBits: { position: 20, normal: 16, uv: 20 }, reports: [] }));
const byFile = new Map(existing.reports.map((report) => [report.file, report]));
for (const report of reports) byFile.set(report.file, report);
await fs.writeFile(artifactPath, JSON.stringify({ quantizationBits: existing.quantizationBits, reports: [...byFile.values()], skipped }, null, 2) + '\n');
console.log(`Extended geometry-compression.json with ${reports.length} new entries, ${skipped.length} skipped.`);
