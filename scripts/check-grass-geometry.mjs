import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const bundle = 'public/assets/vendor.75f6e6ae65453426.js';
const previous = readFileSync(new URL('./fixtures/grass-geometry-original.js', import.meta.url), 'utf8');
const current = readFileSync(new URL(`../${bundle}`, import.meta.url), 'utf8');
const parse = source => ts.createSourceFile('vendor.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const oldTree = parse(previous), newTree = parse(current);

function getClass(tree, name) {
  const declaration = tree.statements.find(node => ts.isClassDeclaration(node) && node.name.text === name);
  assert.ok(declaration, `Missing shipped class ${name}`);
  return declaration.getText(tree);
}

// Verify the discarded values never escape their private locals. Exported cO
// is an alias for zL, not an export of the private quaternion named cO.
function localUses(tree, name) {
  const found = [];
  function visit(node) {
    if (ts.isIdentifier(node) && node.text === name) {
      if (ts.isExportSpecifier(node.parent) && node.parent.propertyName && node === node.parent.name) {
        assert.notEqual(node.parent.propertyName.text, name);
      } else found.push(node.parent.getText(tree));
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return found;
}
assert.deepEqual(localUses(oldTree, 'cO'), ['cO.setFromEuler']);
assert.deepEqual(localUses(oldTree, 'hO'), ['hO.y', 'cO.setFromEuler(hO)']);
assert.deepEqual(localUses(newTree, 'cO'), ['cO=new UA']);
assert.deepEqual(localUses(newTree, 'hO'), ['hO=new jM']);

function getMethod(tree, name) {
  const declaration = tree.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'uO');
  return declaration.members.find(node => node.name?.getText(tree) === name).getText(tree);
}
assert.equal(getMethod(newTree, 'initGeometry'), getMethod(oldTree, 'initGeometry').replace('hO.y=Math.PI,cO.setFromEuler(hO),', ''),
  'Grass generation must differ only by removal of the unused quaternion expressions');
assert.equal(getMethod(newTree, 'setGrassRadius'), getMethod(oldTree, 'setGrassRadius'),
  'Grass radius and uniforms must retain their original behavior');
for (const name of ['UA', 'jM']) {
  const declaration = newTree.statements.find(node => ts.isClassDeclaration(node) && node.name.text === name);
  const callback = declaration.members.find(node => node.name?.getText(newTree) === '_onChangeCallback');
  assert.equal(callback.body.statements.length, 0, 'Default Euler/quaternion callbacks must have no side effects');
}

function generate(tree, count, density, radius) {
  let seed = 0x12345678, randomCalls = 0, disposals = 0;
  const seededMath = Object.create(Math);
  seededMath.random = () => {
    randomCalls++;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  class Geometry {
    constructor() { this.attributes = {}; }
    setIndex(value) { this.index = value; }
    setAttribute(name, attribute) { this.attributes[name] = attribute; }
    dispose() { disposals++; }
  }
  class Attribute {
    constructor(array, itemSize, normalized) {
      this.array = array;
      this.itemSize = itemSize;
      this.normalized = normalized;
    }
  }
  const Grass = runInNewContext(`
    ${getClass(newTree, 'UA')};
    ${getClass(newTree, 'jM')};
    jM.DEFAULT_ORDER = 'XYZ';
    const cO = new UA, hO = new jM;
    ${getClass(tree, 'uO')};
    uO;
  `, {
    Math: seededMath, Float32Array,
    ML: class {}, FD: Geometry, HC: Geometry, BC: Attribute, HB: Attribute,
    rO: count, oO: density, lO: Math.PI,
    By: { randomFloat: (low, high) => low + seededMath.random() * (high - low) },
  });
  const grass = new Grass();
  grass.geo = new Geometry();
  grass.base = {};
  grass.webgl = { store: { grass: { radius } } };
  grass.material = { uniforms: { uHalfBoxSize: {}, uHalfBoxSizeSq: {} } };
  grass.initGeometry(count);
  assert.equal(grass.base.geometry, grass.geo, 'A live mesh must receive the replacement geometry');
  assert.equal(grass.base.needsUpdate, true);
  assert.equal(grass.geo.attributes.instance.needsUpdate, true);
  assert.equal(grass.geo.attributes.instance.array, grass.buffer);
  assert.equal(disposals, 1, 'Previous geometry must be disposed exactly once');
  const callsAfterFirst = randomCalls;
  const geometryAfterFirst = grass.geo;
  grass.initGeometry(count);
  assert.equal(grass.geo, geometryAfterFirst, 'An unchanged count must retain the geometry');
  assert.equal(randomCalls, callsAfterFirst);
  assert.equal(disposals, 1);
  return {
    count: grass.count,
    realCount: grass.realCount,
    instanceCount: grass.geo.instanceCount,
    buffer: Buffer.from(grass.buffer.buffer, grass.buffer.byteOffset, grass.buffer.byteLength),
    index: [...grass.geo.index],
    position: [...grass.geo.attributes.position.array],
    instanceItemSize: grass.geo.attributes.instance.itemSize,
    instanceNormalized: grass.geo.attributes.instance.normalized,
    uniforms: grass.material.uniforms,
    randomCalls,
    disposals,
  };
}

for (const [device, count, density] of [['mobile', 92000, 36], ['desktop', 184000, 72]]) {
  for (const radius of [0.08, 1]) {
    const original = generate(oldTree, count, density, radius);
    const optimized = generate(newTree, count, density, radius);
    assert.deepEqual(optimized, original, `${device}, radius ${radius}: generated grass must remain byte-identical`);
    console.log(`PASS ${device}, radius ${radius}: ${optimized.realCount} instances, ${optimized.buffer.length} identical buffer bytes`);
  }
}
console.log('Grass output, RNG consumption, geometry lifecycle, and uniform side effects are unchanged.');
