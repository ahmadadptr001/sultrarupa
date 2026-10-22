import { cD as assets, cd as Group, b6 as BufferAttribute } from './vendor.75f6e6ae65453426.js';
import { convertMaterials } from './opening-boat.js';
import { createAnoaAnimator } from './anoa-animation.js';
import { assetUrl } from './asset-urls.js';

const MODEL_URL = '/models/player-anoa.glb';
const ACCESSORY_MODEL_URL = '/models/player-anoa-accessories.glb?v=anoa-fit-v3';
const NATIVE_ACCESSORY_MODEL_URL = '/models/player-anoa-native-accessories.glb?v=anoa-fit-v3';
const HEIGHT_RATIO = 2.7455 / 1.8957;
const HEAD_WEAR = [
  'Head-AstronautHelmet', 'Head-Beanie', 'Head-BearBeanie', 'Head-BikeHelmet', 'Head-Bob',
  'Head-BunnyCap', 'Head-Cap', 'Head-Crown', 'Head-DeerHat', 'Head-Dino', 'Head-Fish',
  'Head-FrenchBeret', 'Head-Glass1', 'Head-Glass2', 'Head-GraduationHat', 'Head-Heaset',
  'Head-MotorcycleHelmet', 'Head-Scuba', 'Head-Unicorn', 'Head-Visor',
];
const BODY_WEAR = [
  ['Body-Bumbag', 'Spine1_M'], ['Body-Buoy', 'Chest_M'],
  ['Body-JetPack', 'Chest_M'], ['Body-OxygenBottle', 'Chest_M'], ['Body-Shark', 'Chest_M'],
  ['Body-UrbanBackpack', 'Chest_M'], ['Body-Wings', 'Chest_M'],
];
const BOTTOM_WEAR = [
  'Bottom-LowSneakers', 'Bottom-MidSneakers', 'Bottom-Sandals', 'Bottom-Palm',
  'Bottom-Dino', 'Bottom-FastShoes',
];
const CUSTOM_WEAR = [
  { part: 'head', item: 'Head-VahineCrown', node: 'Accessory_Head', bone: 'Head_M' },
  { part: 'body', item: 'Body-PandaBackpack', node: 'Accessory_Body', bone: 'Chest_M' },
  { part: 'bottom', item: 'Bottom-Boots', node: 'Accessory_Bottom_L', bone: 'Ankle_L' },
  { part: 'bottom', item: 'Bottom-Boots', node: 'Accessory_Bottom_R', bone: 'Ankle_R' },
  ...['L', 'R'].map((side) => ({
    part: 'body', item: 'Body-Dino', node: `Wear_Body-Dino_${side}`, bone: `Wrist_${side}`,
  })),
  { part: 'body', item: 'Body-Dino', node: 'Wear_Body-Dino_Tail', bone: 'Root_M' },
  ...HEAD_WEAR.map((item) => ({ part: 'head', item, node: `Wear_${item}`, bone: 'Head_M' })),
  ...BODY_WEAR.map(([item, bone]) => ({ part: 'body', item, node: `Wear_${item}`, bone })),
  ...BOTTOM_WEAR.flatMap((item) => ['L', 'R'].map((side) => ({
    part: 'bottom', item, node: `Wear_${item}_${side}`, bone: `Ankle_${side}`,
  }))),
];
const WEAR_PARTS = ['head', 'body', 'bottom'];
const WEAR_COLLECTIONS = { head: 'heads', body: 'bodies', bottom: 'bottoms' };
const EMPTY_WEAR = [];
const EXPECTED_WEAR = { head: new Map(), body: new Map(), bottom: new Map() };
for (const { part, item } of CUSTOM_WEAR) {
  EXPECTED_WEAR[part].set(item, (EXPECTED_WEAR[part].get(item) || 0) + 1);
}
const SHORT_NAME = 'Chara_Low_RigGameSkeleton';
// Joint centres measured on the anoa replacement, in its authored Y-up space.
// Legs are hidden above the skirt hem, so hip and knee sit at their anatomical
// heights even though no visible surface reaches them.
const JOINTS = {
  Root_M: [0, .82, 0], Spine1_M: [0, 1.02, 0], Chest_M: [0, 1.24, -.01], Head_M: [0, 1.38, .03],
  Shoulder_L: [.27, 1.25, -.02], Elbow_L: [.39, .92, 0], Wrist_L: [.44, .70, .05],
  Shoulder_R: [-.27, 1.25, -.02], Elbow_R: [-.39, .92, 0], Wrist_R: [-.44, .70, .05],
  Hip_L: [.15, .78, 0], Knee_L: [.19, .48, .01], Ankle_L: [.19, .20, 0], Toes_L: [.21, .05, .08],
  Hip_R: [-.15, .78, 0], Knee_R: [-.19, .48, .01], Ankle_R: [-.19, .20, 0], Toes_R: [-.21, .05, .08],
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
    // The muzzle juts forward low on the skull, so the head owns forward
    // geometry below the neck line; ears and horns sit far out on x, where the
    // narrow gate that keeps the pauldrons off the head must not reach them.
    const head = Math.max(smooth(1.30, 1.42, y), smooth(.20, .34, z) * smooth(1.22, 1.34, y))
      * (1 - smooth(.17, .26, Math.abs(x)) * (1 - smooth(1.36, 1.46, y)));
    // The arm leaves the silhouette below the pauldrons, hugs the narrow waist
    // and flares at the chest; the hanging sash stays inside its edge.
    // The inward-facing thumbs reach x=0.36 below the wrist. Keep the entire
    // hand beyond the arm boundary, otherwise a few thumb vertices stay on
    // the pelvis and stretch into spikes when the greeting raises the hand.
    const edge = .24 + .072 * (1 - smooth(.60, .92, y))
      + .06 * (1 - smooth(.53, .60, y)) + .06 * smooth(1.10, 1.28, y);
    const arm = smooth(edge - .025, edge + .035, Math.abs(x))
      * (1 - smooth(1.27, 1.38, y)) * smooth(.32, .45, y);
    if (y < .80) {
      // Only the leg below the wrapped skirt hem is driven; the cloth above it
      // keeps following the pelvis, so strides cannot tear the hem open. The
      // inner fade keeps the cloth hanging between the legs on the pelvis too.
      const exposedThigh = (1 - smooth(.03, .12, z)) * smooth(.08, .17, Math.abs(x));
      const hem = .50 + .12 * exposedThigh;
      const leg = (1 - smooth(.30, hem, y))
        * smooth(.005, .02 + .10 * smooth(.35, .55, y), Math.abs(x));
      const ankle = 1 - smooth(.20, .32, y), knee = 1 - smooth(.42, .60, y);
      add('Root_M', 1 - leg);
      // Keep the shoe rigid on its ankle so its sole cannot tear at the toes.
      add(`Ankle_${side}`, leg * ankle);
      add(`Knee_${side}`, leg * (1 - ankle) * knee);
      add(`Hip_${side}`, leg * (1 - ankle) * (1 - knee));
    } else {
      const chest = smooth(.98, 1.26, y), spine = smooth(.76, 1.02, y);
      add('Root_M', (1 - head) * (1 - chest) * (1 - spine));
      add('Spine1_M', (1 - head) * (1 - chest) * spine);
      add('Chest_M', (1 - head) * chest);
      add('Head_M', head);
    }
    for (const name of Object.keys(influence)) influence[name] *= 1 - arm;
    const elbow = 1 - smooth(.86, 1.04, y), wrist = 1 - smooth(.63, .77, y);
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
  const custom = attachCustomAccessories(root, bones, state);
  const accessoryMaterial = actor.charMesh.material;
  const accessorySkeleton = actor.charMesh.skeleton || actor.skeleton;
  const accessories = WEAR_PARTS.map((part) => {
    const accessory = new template.source.constructor(
      new template.source.geometry.constructor(), accessoryMaterial);
    accessory.name = `Custom player ${part} accessory`;
    accessory.frustumCulled = false;
    accessory.castShadow = true;
    accessory.receiveShadow = true;
    accessory.opacity = 1;
    accessory.colorId = actor.charMesh.colorId;
    accessory.faceColor = actor.charMesh.faceColor;
    accessory.faceData = actor.charMesh.faceData;
    accessory.visible = false;
    actor.charMesh.add(accessory);
    accessory.bind(accessorySkeleton, actor.charMesh.bindMatrix);
    return { part, mesh: accessory, emptyGeometry: accessory.geometry };
  });
  const fitted = { head: new Map(), body: new Map(), bottom: new Map() };
  for (const wear of custom) {
    const items = fitted[wear.part];
    if (!items.has(wear.item)) items.set(wear.item, []);
    items.get(wear.item).push(wear);
  }
  for (const part of WEAR_PARTS) {
    for (const [item, matches] of fitted[part]) {
      if (matches.length !== EXPECTED_WEAR[part].get(item)) fitted[part].delete(item);
    }
  }
  const entry = { actor, root, mesh, bones, originalMeshes, hiddenMaterial, reference, accessories,
    custom, fitted, selection: {}, selectedGeometry: {},
    sources: reference.map((bone) => byName.get(bone.name)), delta: root.position.clone(),
    rootIndex: reference.findIndex((bone) => !bone.parent?.isBone),
  };
  entry.animator = createAnoaAnimator(entry, template);
  return entry;
}
function attachCustomAccessories(root, bones, state) {
  if (!state.customSource) return [];
  const byName = new Map(bones.map((bone) => [bone.name.replace('Custom_', ''), bone]));
  root.updateMatrixWorld(true);
  state.customSource.updateMatrixWorld(true);
  const sourceInverse = state.customSource.matrixWorld.clone().invert();
  const attached = [];
  for (const wear of CUSTOM_WEAR) {
    const source = state.customSource.getObjectByName(wear.node);
    const bone = byName.get(wear.bone);
    if (!source || !bone) continue;
    const object = source.clone();
    object.name = `${wear.node} worn`;
    object.castShadow = true;
    object.receiveShadow = true;
    object.matrixAutoUpdate = false;
    // Retain both the object's transform and any Blender collection parents.
    // The exported character space becomes the custom rig's bind-pose space.
    object.matrix.copy(bone.matrixWorld).invert().multiply(root.matrixWorld)
      .multiply(sourceInverse).multiply(source.matrixWorld);
    object.visible = false;
    bone.add(object);
    attached.push({ ...wear, object });
  }
  return attached;
}
function restoreFootwearOffset(entry, game) {
  if (!entry.shoeOffsetSuppressed) return;
  const nativeItem = game.app?.$items?.bottom?.[entry.actor.outfit?.bottom];
  entry.actor.shoesOffset = nativeItem ? nativeItem.shoesOffset || 0 : entry.nativeShoesOffset;
  entry.shoeOffsetSuppressed = false;
}
function fittedWear(entry, part, item) {
  return entry.fitted[part].get(item) || EMPTY_WEAR;
}
function syncFootwearOffset(entry, game) {
  const bottom = game.savestate?.game?.player?.bottom;
  if (!fittedWear(entry, 'bottom', bottom).length) {
    restoreFootwearOffset(entry, game);
    return;
  }
  // These soles are authored at the anoa's ground plane. The original shoes'
  // lift would otherwise raise the entire replacement above the floor.
  if (!entry.shoeOffsetSuppressed || entry.actor.shoesOffset !== 0) {
    entry.nativeShoesOffset = entry.actor.shoesOffset;
  }
  entry.actor.shoesOffset = 0;
  entry.shoeOffsetSuppressed = true;
}
function detach(entry, game) {
  if (!entry) return;
  restoreFootwearOffset(entry, game);
  entry.root.removeFromParent(); entry.mesh.skeleton.dispose();
  for (const { mesh, emptyGeometry } of entry.accessories) {
    mesh.removeFromParent();
    emptyGeometry.dispose();
  }
  for (const { object } of entry.custom) object.removeFromParent();
  for (const [mesh, material] of entry.originalMeshes) mesh.material = material;
  entry.hiddenMaterial.dispose();
}
function syncAccessories(entry, game) {
  const character = game.character;
  const player = game.savestate?.game?.player;
  if (!character || !player) return;
  let changed = !entry.accessoriesSynced;
  for (const part of WEAR_PARTS) {
    const geometry = character[WEAR_COLLECTIONS[part]]?.[player[part]];
    if (entry.selection[part] !== player[part] || entry.selectedGeometry[part] !== geometry) {
      entry.selection[part] = player[part];
      entry.selectedGeometry[part] = geometry;
      changed = true;
    }
  }
  if (changed) {
    for (const { object } of entry.custom) object.visible = false;
    for (const { part, mesh } of entry.accessories) {
      const matches = fittedWear(entry, part, player[part]);
      for (const { object } of matches) object.visible = true;
      const geometry = entry.selectedGeometry[part];
      mesh.visible = Boolean(geometry && !matches.length);
      if (mesh.visible && mesh.geometry !== geometry) mesh.geometry = geometry;
    }
    entry.accessoriesSynced = true;
  }
  for (const { mesh } of entry.accessories) {
    if (mesh.visible) {
      mesh.colorId = entry.actor.charMesh.colorId;
      mesh.faceColor = entry.actor.charMesh.faceColor;
      mesh.faceData = entry.actor.charMesh.faceData;
    }
  }
  syncFootwearOffset(entry, game);
}
function animate(entry, game) {
  const { actor, bones, sources, reference, rootIndex, delta } = entry;
  entry.root.scale.setScalar(actor.charMesh.scale.x * 100 * HEIGHT_RATIO);
  entry.root.position.copy(actor.charMesh.position);
  entry.root.visible = actor.charMesh.visible;
  for (let i = 0; i < bones.length; i++) {
    const bone = bones[i];
    bone.quaternion.copy(sources[i].quaternion);
    if (i === rootIndex) {
      bone.quaternion.premultiply(actor.charMesh.quaternion);
      delta.copy(sources[i].position).sub(reference[i].position)
        .applyQuaternion(actor.charMesh.quaternion).multiplyScalar(.01 / HEIGHT_RATIO);
      bone.position.fromArray(JOINTS.Root_M).add(delta);
    }
  }
  entry.animator?.update();
  syncAccessories(entry, game);
  // Native mixer, locomotion, and collisions keep running. Only hide old visuals.
  for (const [mesh] of entry.originalMeshes) mesh.material = entry.hiddenMaterial;
  entry.root.updateMatrixWorld(true);
}

export function installPlayerCharacter(game) {
  if (game.playerCharacter) return;
  const state = game.playerCharacter = { status: 'loading', mode: 'native-retarget', entry: null };
  const loadCharacter = () => assets.load(assetUrl(MODEL_URL), { noCache: true }).then((gltf) => {
    convertMaterials(gltf.scene);
    gltf.scene.traverse((o) => { if (!state.source && o.isMesh) state.source = o; });
    if (!state.source) throw new Error('Character model contains no mesh');
  });
  const loadAccessories = () => Promise.all(
    // The bundled loader infers formats with endsWith('.glb'); a version query
    // therefore needs an explicit loader to keep returning parsed glTF scenes.
    [ACCESSORY_MODEL_URL, NATIVE_ACCESSORY_MODEL_URL].map((url) => assets.load(assetUrl(url), { noCache: true, loader: 'gltf' })
      .catch((error) => { console.error('[Player accessories]', error); return null; })),
  ).then((models) => {
    const group = new Group();
    group.name = 'Custom accessories';
    for (const model of models) {
      if (!model) continue;
      convertMaterials(model.scene);
      group.add(model.scene);
    }
    state.customSource = group;
  });
  const load = () => Promise.all([loadCharacter(), loadAccessories()]).then(() => {
    state.status = 'ready';
  }).catch((error) => { state.status = 'error'; console.error('[Player character]', error); });
  game.hooks.beforePreload.watch(() => game.app.$preloader.task(load()));
  game.hooks.beforeUpdate.watch(() => {
    if (state.entry) syncFootwearOffset(state.entry, game);
  });
  game.hooks.beforeRender.watch(() => {
    if (state.status !== 'ready' || !state.source) return;
    const scene = game.scenes?.current;
    const actor = scene?.player || (scene?.id === 'IslandIntro' ? scene.npcIntro : null);
    if (!state.defaultsApplied && game.app?.$items?.headDefault) {
      const player = game.savestate?.game?.player;
      const items = game.app.$items;
      if (player) {
        if (player.head === items.headDefault) player.head = 'Head-Empty';
        if (player.body === items.bodyDefault) player.body = 'Body-Empty';
        if (player.bottom === items.bottomDefault) player.bottom = 'Bottom-Empty';
      }
      state.defaultsApplied = true;
    }
    if (state.entry && state.entry.actor !== actor) { detach(state.entry, game); state.entry = null; }
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
    animate(state.entry, game);
  });
}
