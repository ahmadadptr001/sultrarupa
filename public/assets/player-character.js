import { cD as assets, cd as Group, b6 as BufferAttribute } from './vendor.75f6e6ae65453426.js';
import { convertMaterials } from './opening-boat.js';

const MODEL_URL = '/models/player-character.glb';
const HEIGHT_RATIO = 2.387394 / 1.89957;
const SHORT_NAME = 'Chara_Low_RigGameSkeleton';
// Joint centres measured on the replacement, in its authored Y-up space.
const JOINTS = {
  Root_M: [0, .61, 0], Spine1_M: [0, .91, 0], Chest_M: [0, 1.23, 0], Head_M: [0, 1.365, 0],
  Shoulder_L: [.20, 1.23, -.045], Elbow_L: [.275, .925, -.045], Wrist_L: [.29, .755, -.01],
  Shoulder_R: [-.20, 1.23, -.045], Elbow_R: [-.275, .925, -.045], Wrist_R: [-.29, .755, -.01],
  Hip_L: [.115, .61, 0], Knee_L: [.12, .40, -.015], Ankle_L: [.12, .18, -.015], Toes_L: [.12, .065, .12],
  Hip_R: [-.115, .61, 0], Knee_R: [-.12, .40, -.015], Ankle_R: [-.12, .18, -.015], Toes_R: [-.12, .065, .12],
};
function smooth(a, b, value) {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function shortName(bone) { return bone.name.replace(SHORT_NAME, ''); }

// Constrain weights to anatomical neighbours, rather than the nearest arbitrary
// bones. Each joint drives the limb AFTER it: shoulder->elbow, hip->knee, etc.
function skinGeometry(source, bones) {
  const geometry = source.clone(), positions = geometry.attributes.position;
  const indices = new Uint16Array(positions.count * 4);
  const weights = new Float32Array(positions.count * 4);
  const boneIndex = Object.fromEntries(bones.map((bone, i) => [shortName(bone), i]));
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const side = x >= 0 ? 'L' : 'R', influence = {};
    const add = (name, weight) => { influence[name] = (influence[name] || 0) + weight; };
    const head = smooth(1.32, 1.41, y);
    const armEdge = .23 - .05 * smooth(.95, 1.24, y);
    const scarf = z > .065 ? smooth(.22, .26, Math.abs(x)) : 1;
    const arm = smooth(armEdge - .014, armEdge + .024, Math.abs(x))
      * (1 - smooth(1.25, 1.34, y)) * smooth(.55, .63, y)
      * smooth(-.18, -.14, z) * scarf;
    if (y < .67) {
      const pelvis = smooth(.54, .67, y), knee = 1 - smooth(.33, .47, y);
      const ankle = 1 - smooth(.17, .25, y);
      // Keep the shoe rigid on its ankle so its sole cannot tear at the toes.
      add(`Ankle_${side}`, (1 - pelvis) * ankle);
      add(`Knee_${side}`, (1 - pelvis) * (1 - ankle) * knee);
      add(`Hip_${side}`, (1 - pelvis) * (1 - ankle) * (1 - knee));
      add('Root_M', pelvis);
    } else {
      const chest = smooth(.92, 1.19, y), spine = smooth(.67, .90, y);
      add('Root_M', (1 - head) * (1 - chest) * (1 - spine));
      add('Spine1_M', (1 - head) * (1 - chest) * spine);
      add('Chest_M', (1 - head) * chest);
      add('Head_M', head);
    }
    for (const name of Object.keys(influence)) influence[name] *= 1 - arm;
    const elbow = 1 - smooth(.85, 1.01, y), wrist = 1 - smooth(.70, .80, y);
    add(`Shoulder_${side}`, arm * (1 - elbow));
    add(`Elbow_${side}`, arm * elbow * (1 - wrist));
    add(`Wrist_${side}`, arm * elbow * wrist);
    const strongest = Object.entries(influence).filter(([, w]) => w > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = strongest.reduce((sum, [, w]) => sum + w, 0);
    strongest.forEach(([name, w], k) => {
      indices[i * 4 + k] = boneIndex[name]; weights[i * 4 + k] = w / total;
    });
  }
  geometry.setAttribute('skinIndex', new BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new BufferAttribute(weights, 4));
  return geometry;
}

function getTemplate(game) {
  // Untouched resource pose: attachment timing never changes the bind pose.
  const armature = game.character?.armature;
  if (!armature) return null;
  let source;
  armature.traverse((o) => { if (!source && o.isSkinnedMesh) source = o; });
  if (!source) return null;
  const bones = source.skeleton.bones, neutral = new Group();
  neutral.rotation.x = Math.PI / 2;
  const copies = bones.map((bone) => {
    const copy = new bone.constructor();
    copy.name = bone.name; copy.position.copy(bone.position); copy.quaternion.copy(bone.quaternion);
    return copy;
  });
  bones.forEach((bone, i) => {
    const parent = bones.indexOf(bone.parent);
    (parent < 0 ? neutral : copies[parent]).add(copies[i]);
  });
  neutral.updateMatrixWorld(true);
  return { source, bones, copies, neutral };
}

function attach(actor, template, state) {
  const byName = new Map(actor.skeleton.bones.map((bone) => [bone.name, bone]));
  const { bones: reference, copies } = template;
  if (reference.some((bone) => !byName.has(bone.name))) return null;
  const root = new Group(); root.name = 'Custom character rig';
  const bones = reference.map((bone) => {
    const copy = new bone.constructor(); copy.name = `Custom_${shortName(bone)}`; return copy;
  });
  reference.forEach((bone, i) => {
    const parent = reference.indexOf(bone.parent);
    const point = root.position.clone().fromArray(JOINTS[shortName(bone)]);
    const rotation = copies[i].getWorldQuaternion(root.quaternion.clone());
    if (parent >= 0) {
      const inverse = copies[parent].getWorldQuaternion(root.quaternion.clone()).invert();
      point.sub(root.position.clone().fromArray(JOINTS[shortName(reference[parent])])).applyQuaternion(inverse);
      rotation.premultiply(inverse);
    }
    bones[i].position.copy(point); bones[i].quaternion.copy(rotation);
    (parent < 0 ? root : bones[parent]).add(bones[i]);
  });
  const mesh = new template.source.constructor(state.geometry, state.material);
  mesh.name = 'Custom player character'; mesh.frustumCulled = false;
  root.add(mesh); root.updateMatrixWorld(true);
  mesh.bind(new template.source.skeleton.constructor(bones));
  const originalMeshes = [];
  actor.armature.traverse((o) => { if (o.isMesh) originalMeshes.push([o, o.material]); });
  // The engine also uses Mesh.visible to decide whether an NPC can move and
  // update its skeleton. Hide drawing through a private material instead.
  const hiddenMaterial = state.material.clone();
  hiddenMaterial.visible = false;
  actor.armature.add(root);
  return { actor, root, mesh, bones, originalMeshes, hiddenMaterial, reference,
    sources: reference.map((bone) => byName.get(bone.name)), delta: root.position.clone(),
    rootIndex: reference.findIndex((bone) => !bone.parent?.isBone),
  };
}
function detach(entry) {
  if (!entry) return;
  entry.root.removeFromParent(); entry.mesh.skeleton.dispose();
  for (const [mesh, material] of entry.originalMeshes) mesh.material = material;
  entry.hiddenMaterial.dispose();
}
function animate(entry) {
  const { actor, bones, sources, reference, rootIndex, delta } = entry;
  entry.root.scale.setScalar(actor.charMesh.scale.x * 100 * HEIGHT_RATIO);
  entry.root.position.copy(actor.charMesh.position);
  entry.root.visible = actor.charMesh.visible;
  bones.forEach((bone, i) => {
    bone.quaternion.copy(sources[i].quaternion);
    if (i === rootIndex) {
      bone.quaternion.premultiply(actor.charMesh.quaternion);
      delta.copy(sources[i].position).sub(reference[i].position)
        .applyQuaternion(actor.charMesh.quaternion).multiplyScalar(.01 / HEIGHT_RATIO);
      bone.position.fromArray(JOINTS.Root_M).add(delta);
    }
  });
  // Native mixer, locomotion, and collisions keep running. Only hide old visuals.
  for (const [mesh] of entry.originalMeshes) mesh.material = entry.hiddenMaterial;
  entry.root.updateMatrixWorld(true);
}

export function installPlayerCharacter(game) {
  if (game.playerCharacter) return;
  const state = game.playerCharacter = { status: 'loading', mode: 'retargeted', entry: null };
  const load = () => assets.load(MODEL_URL, { noCache: true }).then((gltf) => {
    convertMaterials(gltf.scene);
    gltf.scene.traverse((o) => { if (!state.source && o.isMesh) state.source = o; });
    if (!state.source) throw new Error('Character model contains no mesh');
    state.status = 'ready';
  }).catch((error) => { state.status = 'error'; console.error('[Player character]', error); });
  game.hooks.beforePreload.watch(() => game.app.$preloader.task(load()));
  game.hooks.beforeRender.watch(() => {
    if (!state.source) return;
    const scene = game.scenes?.current;
    const actor = scene?.player || (scene?.id === 'IslandIntro' ? scene.npcIntro : null);
    if (state.entry && state.entry.actor !== actor) { detach(state.entry); state.entry = null; }
    if (!actor?.armature || !actor?.skeleton || !actor?.charMesh) return;
    if (!state.template) {
      state.template = getTemplate(game);
      if (!state.template) return;
      state.geometry = skinGeometry(state.source.geometry, state.template.bones);
      state.material = state.source.material;
    }
    if (!state.entry) {
      state.entry = attach(actor, state.template, state);
      if (!state.entry) return;
      state.skinned = state.entry.mesh; state.attachedTo = actor.armature;
    }
    animate(state.entry);
  });
}
