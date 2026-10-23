// node scripts/prepare-gallery-frame.mjs <source.glb> [Blender executable]
// Uses the original 2048px baked texture, 8% mesh density, and precise Draco
// encoding. It writes a separate runtime asset and never changes the source.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import draco from 'draco3dgltf';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || 'C:/Users/user/Downloads/bingkai.glb');
const blender = process.argv[3] || 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe';
const destination = path.join(root, 'public/models/interiors/bingkai.glb');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const original = await fs.readFile(source);
const originalHash = hash(original);
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sultra-gallery-frame-'));
const intermediate = path.join(temporary, 'frame.glb');
const meshReport = path.join(temporary, 'mesh.json');
execFileSync(blender, ['--background', '--python', path.join(root, 'scripts/prepare-gallery-frame.py'),
  '--', source, intermediate, meshReport], { stdio: 'inherit', windowsHide: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco.createEncoderModule(),
  'draco3d.decoder': await draco.createDecoderModule(),
});
const document = await io.read(intermediate);
const textures = [];
for (const texture of document.getRoot().listTextures()) {
  const input = texture.getImage();
  const dimensions = texture.getSize();
  const compressed = await sharp(input).webp({ quality: 94, effort: 5 }).toBuffer();
  texture.setImage(compressed).setMimeType('image/webp');
  assert.deepEqual(texture.getSize(), dimensions, 'Texture resolution changed');
  textures.push({ dimensions, beforeBytes: input.length, afterBytes: compressed.length });
}
document.createExtension(EXTTextureWebP).setRequired(true);
document.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
  method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
  encodeSpeed: 5, decodeSpeed: 5, quantizationVolume: 'mesh',
  quantizationBits: { POSITION: 18, NORMAL: 12, TEX_COORD: 16, COLOR: 16, GENERIC: 16 },
});
const output = await io.writeBinary(document);
const decoded = await io.readBinary(output);
const triangles = (doc) => doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives())
  .reduce((sum, primitive) => sum + primitive.getIndices().getCount() / 3, 0);
let degenerateTriangles = 0;
for (const mesh of document.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
  const vertices = primitive.getAttribute('POSITION').getArray();
  const indices = primitive.getIndices().getArray();
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
    const u = [0, 1, 2].map((axis) => vertices[b + axis] - vertices[a + axis]);
    const v = [0, 1, 2].map((axis) => vertices[c + axis] - vertices[a + axis]);
    if (Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]) === 0) degenerateTriangles++;
  }
}
// EdgeBreaker may discard zero-area faces introduced by mesh decimation.
assert.ok(triangles(decoded) <= triangles(document));
assert.ok(triangles(document) - triangles(decoded) <= degenerateTriangles,
  'Draco discarded non-degenerate geometry');
const primitives = (doc) => doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives());
for (let index = 0; index < primitives(document).length; index++) {
  const before = primitives(document)[index].getAttribute('POSITION');
  const after = primitives(decoded)[index].getAttribute('POSITION');
  for (const bound of ['getMin', 'getMax']) {
    const a = before[bound]([]), b = after[bound]([]);
    assert.ok(a.every((value, axis) => Math.abs(value - b[axis]) < 0.00001), 'Draco changed frame bounds');
  }
}
assert.ok(decoded.getRoot().listMeshes().length > 0);
assert.equal(hash(await fs.readFile(source)), originalHash, 'Source model changed');
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, output);
const report = { source: path.basename(source), sourceSha256: originalHash,
  beforeBytes: original.length, afterBytes: output.length, textures,
  decodedTriangles: triangles(decoded), degenerateTriangles,
  ...JSON.parse(await fs.readFile(meshReport, 'utf8')),
  runtime: {
    forward: '+Z', up: '+Y',
    bounds: { min: primitives(decoded)[0].getAttribute('POSITION').getMin([]),
      max: primitives(decoded)[0].getAttribute('POSITION').getMax([]) },
    photoPlane: { position: [0.0012, 0.949, -0.006], size: [0.92, 1.42] },
    notes: 'Center the model on Y 0.9512. Its +Z front faces the room. Fit the photo snugly to preserve the inner beading baked into the backing texture.',
  },
};
await fs.mkdir(path.join(root, 'artifacts/interior-gallery'), { recursive: true });
await fs.writeFile(path.join(root, 'artifacts/interior-gallery/frame-asset.json'), JSON.stringify(report, null, 2) + '\n');
// Remove only the two files created in this script's own temporary directory.
assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
await Promise.all([fs.unlink(intermediate), fs.unlink(meshReport)]);
await fs.rmdir(temporary);
console.log(JSON.stringify({ destination, beforeBytes: original.length,
  afterBytes: output.length, decodedTriangles: triangles(decoded), textures,
  runtime: report.runtime }, null, 2));
