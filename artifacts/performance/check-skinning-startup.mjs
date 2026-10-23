import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

// Pinned source remains usable after the optimization has been committed.
const baselineCommit = '6b5ca2feecf6ffc9786d4918a89e93d49db7b687';
const sourcePath = 'public/assets/player-character.js';
const modelPath = 'public/models/player-anoa.glb';
const beforeSource = execFileSync('git', ['show', `${baselineCommit}:${sourcePath}`], { encoding: 'utf8' });
const afterSource = fs.readFileSync(sourcePath, 'utf8');
const hash = (value) => createHash('sha256').update(value).digest('hex');
class BufferAttribute {
  constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; }
}
function compile(source) {
  const start = source.indexOf('function smooth(');
  const end = source.indexOf('\nfunction getTemplate');
  assert.ok(start >= 0 && end > start, 'Cannot find the unchanged function boundaries');
  // Both implementations run in the same JS realm; vm.Context distorts timings.
  return new Function('BufferAttribute', `const SHORT_NAME = 'Chara_Low_RigGameSkeleton';
    ${source.slice(start, end)}
    return skinGeometry;`)(BufferAttribute);
}
function geometry(positions) {
  return {
    clone() {
      const array = positions.slice();
      return {
        attributes: {
          position: {
            count: array.length / 3,
            getX: (i) => array[i * 3],
            getY: (i) => array[i * 3 + 1],
            getZ: (i) => array[i * 3 + 2],
          },
        },
        setAttribute(name, attribute) { this.attributes[name] = attribute; },
      };
    },
  };
}
const bones = [
  'Root_M', 'Spine1_M', 'Chest_M', 'Head_M',
  ...['L', 'R'].flatMap((side) => ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle', 'Toes']
    .map((joint) => `${joint}_${side}`)),
].map((name) => ({ name: `Chara_Low_RigGameSkeleton${name}` }));
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const document = await io.read(modelPath);
const positions = document.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute('POSITION').getArray();
const before = compile(beforeSource), after = compile(afterSource);
function assertIdentical(input, skeleton) {
  const oldGeometry = before(input, skeleton), newGeometry = after(input, skeleton);
  for (const name of ['skinIndex', 'skinWeight']) {
    const oldArray = oldGeometry.attributes[name].array;
    const newArray = newGeometry.attributes[name].array;
    assert.equal(Buffer.compare(Buffer.from(oldArray.buffer), Buffer.from(newArray.buffer)), 0,
      `${name} differs at the byte level`);
  }
}
const realGeometry = geometry(positions);
assertIdentical(realGeometry, bones);
assertIdentical(realGeometry, [...bones].reverse());

// Include branch boundaries and equal-weight cases outside this exact mesh.
const boundaryPositions = [];
for (const x of [-.5, -.44, -.36, -.27, -.26, -.17, -.08, -.02, -.005, 0, .005, .02, .08, .17, .26, .27, .36, .44, .5]) {
  for (const y of [0, .2, .3, .32, .42, .45, .5, .53, .6, .63, .76, .77, .8, .86, .92, .98, 1.02, 1.04, 1.1, 1.22, 1.26, 1.27, 1.28, 1.3, 1.34, 1.36, 1.38, 1.42, 1.46, 2]) {
    for (const z of [-.2, 0, .03, .12, .2, .34, .5]) boundaryPositions.push(x, y, z);
  }
}
assertIdentical(geometry(new Float32Array(boundaryPositions)), bones);

// Recompile to measure first invocation as well as warmed median costs.
const implementations = { before: compile(beforeSource), after: compile(afterSource) };
const samples = { before: [], after: [] };
for (let run = 0; run < 11; run++) {
  for (const name of run % 2 ? ['after', 'before'] : ['before', 'after']) {
    const start = performance.now();
    implementations[name](realGeometry, bones);
    samples[name].push(performance.now() - start);
  }
}
function summarize(values) {
  const sorted = values.slice(1).sort((a, b) => a - b);
  return { firstMs: values[0], medianWarmMs: (sorted[4] + sorted[5]) / 2, samplesMs: values };
}
const report = {
  baselineCommit, sourcePath, modelPath,
  modelSha256: hash(fs.readFileSync(modelPath)),
  beforeSourceSha256: hash(beforeSource), afterSourceSha256: hash(afterSource),
  realVertices: positions.length / 3,
  comparedRealAttributeValues: positions.length / 3 * 4 * 2,
  reversedBoneOrderIdentical: true,
  boundaryVertices: boundaryPositions.length / 3,
  bitwiseIdentical: true,
  runtime: process.version,
  notes: 'Isolated Node CPU timings, not Lighthouse scores or mobile startup times. Geometry clone copies positions only for both implementations.',
  before: summarize(samples.before), after: summarize(samples.after),
};
fs.writeFileSync('artifacts/performance/skinning-startup.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
