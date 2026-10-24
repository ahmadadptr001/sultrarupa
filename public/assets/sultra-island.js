import layout from './sultra-island-layout.js';
import { HOUSE_EXHIBITS, CULTURE_GUIDES } from './sultra-culture-data.js';
import { createCultureUI } from './sultra-culture-ui.js';
import { installSultraPhoneMap } from './sultra-phone-map.js';
import { installSultraPhoneCulture } from './sultra-phone-culture.js';
import { registerSultraGuideDialog } from './sultra-guide-dialogs.js';
import { createHouseInteractions } from './sultra-house-interaction.js';
import { createLazyHouseInterior } from './sultra-lazy-interior.js';
import { createModelStream } from './sultra-model-stream.js';
import { createCultureVoice } from './sultra-culture-voice.js';
import { registerLuloDancers, installSultraLulo } from './sultra-lulo.js';
import { convertMaterials } from './opening-boat.js';
import { assetUrl } from './asset-urls.js';
import {
  cD as assets, cd as Group, cx as Box3, aS as Vector3, aU as Matrix4, bm as Quaternion,
  b7 as BufferGeometry, b5 as Mesh, a$ as MeshBasicMaterial,
} from './vendor.75f6e6ae65453426.js';

const MAIN = 'IslandWest';
const INTRO = 'IslandIntro';
const SCENES = new Set([MAIN, INTRO]);
const GROUND = layout.groundY ?? 3;
const GUIDE_OFFSET = new Vector3(0, 3.3, 0);
const GUIDE_UP = new Vector3(0, 1, 0);
const TREE_PRECISION = 20;
const copy = (value) => JSON.parse(JSON.stringify(value));
const guideUID = (id) => `NPC_SultraGuide_${id}`;
const guideSubtype = (id) => `SultraGuide_${id}`;
const MONUMENT_NPC_PREFIX = 'NPC_SultraInfo_';
const MONUMENT_GUIDE_MODEL = '/models/culture/monument-guide.glb';
const MONUMENT_GUIDE_LOAD_RADIUS = 90;
// The island's characters are chunky (~2.6 m player); a 1.9 m guide read as tiny.
const MONUMENT_GUIDE_HEIGHT = 2.9;
const MONUMENT_GUIDES = {
  'tugu-mtq': {
    title: 'Tugu MTQ: Tugu Religi Sultra',
    region: 'Kendari, Sulawesi Tenggara',
    visitingRegion: 'Tugu setinggi 99 meter ini mulai dibangun pada 2004 untuk menyambut MTQ Nasional XXI tahun 2006. Empat pilarnya melambangkan Kendari, Buton, Muna, dan Kolaka, empat kabupaten pertama di Sulawesi Tenggara.',
    description: [
      'Tugu ini dirancang oleh Danny Pomanto dan dahulu bernama Tugu Persatuan. Pada 2015 namanya berubah menjadi Tugu Religi, dan kawasan sekitarnya menjadi ruang publik warga Kendari.',
    ],
  },
  'patung-oputa': {
    title: 'Patung Oputa Yi Koo: Sultan Himayatuddin',
    region: 'Kesultanan Buton, Sulawesi Tenggara',
    visitingRegion: 'Patung ini menghormati Sultan Himayatuddin Muhammad Saidi, Sultan Buton ke-20 dan ke-23 yang meninggalkan istana untuk bergerilya melawan Belanda.',
    description: [
      'Karena perjuangannya di hutan, ia dikenal sebagai Oputa Yi Koo, raja yang bergerilya. Ia dianugerahi gelar Pahlawan Nasional pada 7 November 2019.',
    ],
  },
};
function joggerRoute(points, index) {
  return {
    index, points,
    uid: `NPC_SultraJogger_${index}`,
    speed: 6,
  };
}

const JOGGER_POINTS = [
  [-59.85, 141.19], [-59.48, 138.82], [-55.68, 131.71], [-40.01, 115.94],
  [-36.19, 113.57], [-35.69, 112.76], [-36.09, 76.1], [-35.34, 73.35],
  [-32.3, 67.86], [-31.69, 64.57], [-31.77, 61.12], [-32.59, 57.68],
  [-32.18, 55.27], [-33.82, 52.29], [-33.55, 48.94], [-32.27, 47],
  [-29.75, 45.99], [-28.38, 43.95], [-24.68, 41.34], [-18.7, 34.78],
  [-17.64, 33.02], [-18.13, 31.8], [-21.06, 30.02], [-21.53, 28.77],
  [-21.17, 5.57], [-21.47, -20.3], [-22.69, -22.75], [-26.41, -26.5],
  [-30.54, -28.55], [-32.1, -31.98], [-34.9, -33.32], [-35.77, -34.27],
  [-36.24, -38.29], [-39.08, -40.34], [-39.69, -41.79], [-39.63, -44.19],
  [-41.99, -48.09], [-42.06, -52.12], [-43.18, -56.39], [-41.73, -62.64],
  [-41.74, -65.79], [-41.06, -67.12], [-38.82, -68.7], [-38.11, -70.27],
  [-37.84, -76.02], [-33.03, -80.64], [-32.55, -83.49], [-31.61, -85.02],
  [-27.94, -86.51], [-23.65, -91.09], [-21.96, -91.73], [-18.99, -91.64],
  [-12.68, -92.53], [-7.17, -91.93], [15.7, -92.22], [17.67, -93.35],
  [22.86, -98.3], [25.86, -99.37], [66.83, -99.4], [70.71, -99.09],
  [73.96, -97.76], [76.52, -99.07], [78.35, -99.4], [106.32, -99.42],
  [111.86, -98.39], [115.38, -99.33], [121.36, -99.6], [123.05, -100.35],
  [125.51, -102.81], [129.69, -103.57], [132.49, -107.41], [136.57, -109.09],
  [138.11, -111.76], [141.21, -112.71], [146.83, -115.93],
];
const JOGGER_PATHS = [joggerRoute(JOGGER_POINTS, 12)];

function joggerCurve(route) {
  const points = route.points;
  const count = points.length;
  return {
    type: 'BEZIER', closed: false,
    points: points.map((point, index) => {
      const prev = points[Math.max(0, index - 1)];
      const next = points[Math.min(count - 1, index + 1)];
      const dx = next[0] - prev[0];
      const dz = next[1] - prev[1];
      const direction = Math.hypot(dx, dz) || 1;
      const span = Math.min(
        Math.hypot(point[0] - prev[0], point[1] - prev[1]),
        Math.hypot(next[0] - point[0], next[1] - point[1]),
      ) / 3;
      const tangentX = direction ? (dx / direction) * span : 0;
      const tangentZ = direction ? (dz / direction) * span : 0;
      return [
        point[0], GROUND, point[1],
        point[0] - tangentX, GROUND, point[1] - tangentZ,
        point[0] + tangentX, GROUND, point[1] + tangentZ,
      ];
    }),
  };
}

function transform(x, y, z, rotation = 0, scale = 1) {
  return [x, y, z, scale, scale, scale, 0, Math.sin(rotation / 2), 0, Math.cos(rotation / 2)];
}

function culturePointName(id) {
  return `Culture_${id}`;
}

const ARRIVAL_CAM_ID = 'sultra-arrival';
const ARRIVAL_LOOK_AT_POINT = new Vector3();
const ARRIVAL_POINT_POS = new Vector3();
const ARRIVAL_CAMERA_POS = new Vector3();
const ARRIVAL_CAMERA_TARGET = new Vector3();

// Arrival resets the ordinary follow camera behind the player, facing the
// destination, at its normal distance and height without locking movement.
function updateArrivalCamera(scene, state, now) {
  const pending = state.arrival;
  if (!pending) return;
  const cam = scene.playerCam;
  if (!cam?.setTarget || scene.id !== MAIN) {
    if (now - pending.since > 12000) state.arrival = null;
    return;
  }
  const target = cam.targetState;
  if (!target) return;
  if (pending.applied) {
    const player = scene.player?.base?.position;
    const moved = player && Math.hypot(player.x - pending.x, player.z - pending.z) > .15;
    if (moved || cam.isOnPhone || target.currentID !== ARRIVAL_CAM_ID) {
      cam.removeTarget({ id: ARRIVAL_CAM_ID, instant: true });
      state.arrival = null;
    }
    return;
  }
  if (target.currentID && target.currentID !== ARRIVAL_CAM_ID) {
    if (now - pending.since > 12000) state.arrival = null;
    return;
  }
  if (cam.isOnPhone || cam.phoneQtProgress > .01) return;
  if (scene.webgl.store.isTransitionActive?.value) return;
  const focus = state.arrivalFocus.get(pending.id);
  const point = scene.getPoint?.(culturePointName(pending.id));
  const player = scene.player?.base?.position;
  if (!focus || !point || !player || !scene.physics?.isReady || scene.player.canMove === false) return;
  ARRIVAL_POINT_POS.set(point.position.x, GROUND + .2, point.position.z);
  if (player.distanceToSquared(ARRIVAL_POINT_POS) > 25) {
    if (now - pending.since > 12000) state.arrival = null;
    return;
  }
  if (!pending.cameraReset) {
    // Reset the actual follow camera too: changing only its gaze retains the
    // previous orbit height and can put the destination behind the camera.
    cam.updateCameraOptions?.();
    const options = scene.player.cameraOptions;
    ARRIVAL_CAMERA_POS.set(player.x - focus.x, 0, player.z - focus.z);
    if (ARRIVAL_CAMERA_POS.lengthSq() < .01) {
      ARRIVAL_CAMERA_POS.set(0, 0, 1).applyQuaternion(point.quaternion);
    }
    ARRIVAL_CAMERA_POS.normalize().multiplyScalar(options.distance).add(player);
    ARRIVAL_CAMERA_POS.y = player.y + options.elevation;
    ARRIVAL_CAMERA_TARGET.copy(player).add(options.offset);
    scene.physics.setCameraOptions({
      position: ARRIVAL_CAMERA_POS, target: ARRIVAL_CAMERA_TARGET,
      elevation: options.elevation, distance: options.distance,
    });
    cam.base.position.copy(ARRIVAL_CAMERA_POS);
    // Map travel should not replay the island's opening fly-in.
    scene.introCamProgress = 1;
    pending.cameraReset = true;
    return;
  }
  // Keep a natural eye-level view even at a very tall monument. Its base and
  // entrance are the destination, rather than an upward shot of its summit.
  ARRIVAL_LOOK_AT_POINT.set(focus.x, Math.min(focus.y, player.y + 2), focus.z);
  cam.setTarget({
    id: ARRIVAL_CAM_ID, lockPlayer: false, position: false,
    lookAt: ARRIVAL_LOOK_AT_POINT, instant: true,
  });
  pending.x = player.x;
  pending.z = player.z;
  pending.applied = true;
}

function cultureDestinationPoints() {
  const points = {};
  const add = (id, x, z, rotation = 0) => {
    points[culturePointName(id)] = transform(x, GROUND + .2, z, rotation);
  };
  for (const house of layout.houses) {
    add(house.id, house.entrance?.x ?? house.x, house.entrance?.z ?? house.z, house.rotation);
  }
  for (const guide of layout.guides) add(guide.id, guide.x, guide.z, guide.rotation);
  for (const site of layout.monuments || []) {
    const point = monumentVisitPoint(site);
    add(site.id, point.x, point.z, Math.atan2(site.x - point.x, site.z - point.z));
  }
  if (layout.stage || layout.luloStage) {
    const stage = layout.stage || layout.luloStage;
    const dance = stage.dance || stage;
    const speaker = stage.speakers || { x: dance.x, z: dance.z - 9 };
    const dx = dance.x - speaker.x, dz = dance.z - speaker.z;
    const length = Math.hypot(dx, dz) || 1;
    const distance = (dance.radius || 2.5) * 1.3 + 2.6 + .45 + 2.5;
    add('lulo-stage', dance.x + dx / length * distance, dance.z + dz / length * distance,
      Math.atan2(-dx, -dz));
  }
  return points;
}

function forestProps(manifest, preview = false) {
  const offset = preview ? layout.introTransform : { x: 0, z: 0, scale: 1 };
  const scale = offset.scale ?? 1;
  return [...(layout.forest || []), ...(layout.decor || [])].flatMap((tree) => {
    // A missing optional native tree should never prevent the island loading.
    if (!manifest.assets[tree.asset]) return [];
    const transforms = transform(
      tree.x * scale + offset.x, GROUND + ((tree.y ?? GROUND) - GROUND) * scale, tree.z * scale + offset.z,
      tree.rotation, (tree.scale ?? 1) * scale,
    );
    if (tree.scaleXYZ) tree.scaleXYZ.forEach((value, i) => { transforms[3 + i] = value * scale; });
    return [{
      asset: tree.asset,
      traversable: !tree.solid && !['Wall', 'SpeakersOn'].includes(tree.asset),
      transforms,
    }];
  });
}

function visualGeometry(root) {
  let geometry = null;
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (geometry || !object.isMesh || !object.geometry?.attributes?.position) return;
    if (/Collider|Bounds/.test(object.name)) return;
    geometry = object.geometry;
  });
  return geometry;
}

function treeKey(x, y, z) {
  return `${Math.round(x * TREE_PRECISION)},${Math.round(y * TREE_PRECISION)},${Math.round(z * TREE_PRECISION)}`;
}

function sceneData(scene) {
  if (!scene.userData) scene.userData = {};
  return scene.userData;
}

function buildTreeEnvironment(geometries) {
  const treeMap = new Map();
  const trees = [];
  for (const entry of layout.forest || []) {
    const geometry = geometries.get(entry.asset);
    if (!geometry) continue;
    const source = geometry.attributes.position.array;
    const baseScale = entry.scale ?? 1;
    const scaleX = entry.scaleXYZ?.[0] ?? baseScale;
    const scaleY = entry.scaleXYZ?.[1] ?? baseScale;
    const scaleZ = entry.scaleXYZ?.[2] ?? baseScale;
    const baseY = GROUND + ((entry.y ?? GROUND) - GROUND);
    const cosine = Math.cos(entry.rotation ?? 0);
    const sine = Math.sin(entry.rotation ?? 0);
    const index = trees.length;
    let top = 0;
    for (let i = 0; i < source.length; i += 3) {
      const x = entry.x + (source[i] * cosine + source[i + 2] * sine) * scaleX;
      const y = baseY + source[i + 1] * scaleY;
      const z = entry.z + (-source[i] * sine + source[i + 2] * cosine) * scaleZ;
      treeMap.set(treeKey(x, y, z), index);
      if (source[i + 1] > top) top = source[i + 1];
    }
    trees.push({ x: entry.x, z: entry.z, y: baseY, height: Math.max(top * scaleY, .15) });
  }
  return { treeMap, trees };
}

function buildBushEnvironment(geometries) {
  const bushMap = new Map();
  const bushes = [];
  for (const entry of layout.decor || []) {
    if (entry.asset !== 'BushA') continue;
    const geometry = geometries.get('BushA');
    if (!geometry) continue;
    const source = geometry.attributes.position.array;
    const baseScale = entry.scale ?? 1;
    const scaleX = entry.scaleXYZ?.[0] ?? baseScale;
    const scaleY = entry.scaleXYZ?.[1] ?? baseScale;
    const scaleZ = entry.scaleXYZ?.[2] ?? baseScale;
    const baseY = GROUND + ((entry.y ?? GROUND) - GROUND);
    const cosine = Math.cos(entry.rotation ?? 0);
    const sine = Math.sin(entry.rotation ?? 0);
    const index = bushes.length;
    let top = 0;
    let radius = 0;
    for (let i = 0; i < source.length; i += 3) {
      const localX = source[i] * scaleX;
      const localZ = source[i + 2] * scaleZ;
      const x = entry.x + localX * cosine + localZ * sine;
      const y = baseY + source[i + 1] * scaleY;
      const z = entry.z - localX * sine + localZ * cosine;
      bushMap.set(treeKey(x, y, z), index);
      if (source[i + 1] > top) top = source[i + 1];
      radius = Math.max(radius, Math.hypot(localX, localZ));
    }
    bushes.push({ x: entry.x, z: entry.z, y: baseY, height: Math.max(top * scaleY, .2), radius });
  }
  return { bushMap, bushes };
}

async function loadEnvironment(game, state) {
  const manifest = game.app.$manifest.content;
  const geometries = new Map();
  await Promise.all(['PalmTree', 'TreeRoundA', 'TreeRoundF', 'BushA', 'RockA'].map(async (id) => {
    const url = manifest.assets?.[id]?.url;
    if (!url) return;
    try {
      const gltf = await assets.load(assetUrl(url), { noCache: true });
      const geometry = visualGeometry(gltf.scene);
      if (geometry) geometries.set(id, geometry);
    } catch (error) {
      console.error(`[Sultrarupa island] ${id}`, error);
    }
  }));
  state.environment = {
    ...buildTreeEnvironment(geometries),
    ...buildBushEnvironment(geometries),
    rockGeometry: geometries.get('RockA') || null,
  };
}

function createTreeTuning(game) {
  let context = null;
  let output = null;
  let lastPlayed = -Infinity;
  const ensure = () => {
    if (game.audio?.muted?.value) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      output = context.createGain();
      output.gain.value = 1;
      output.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  };
  const unlock = () => ensure();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  return {
    play() {
      const ctx = ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - lastPlayed < .42) return;
      lastPlayed = now;
      for (const [type, ratio, level] of [['triangle', 1, .22], ['sine', 2.01, .07]]) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const base = 430 * ratio;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(base, now);
        oscillator.frequency.exponentialRampToValueAtTime(base * 1.48, now + .055);
        oscillator.frequency.exponentialRampToValueAtTime(base * 1.12, now + .28);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(level, now + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .36);
        oscillator.connect(gain);
        gain.connect(output);
        oscillator.start(now);
        oscillator.stop(now + .38);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      }
    },
  };
}

function createBushTuning(game) {
  let context = null;
  let output = null;
  let noise = null;
  let lastPlayed = -Infinity;
  const ensure = () => {
    if (game.audio?.muted?.value) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      output = context.createGain();
      output.gain.value = 1;
      output.connect(context.destination);
      const length = Math.floor(context.sampleRate * .16);
      noise = context.createBuffer(1, length, context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
      }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  };
  const unlock = () => ensure();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  return {
    play(intensity = 1) {
      const ctx = ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - lastPlayed < .18) return;
      lastPlayed = now;
      for (let burst = 0; burst < 4; burst++) {
        const source = ctx.createBufferSource();
        source.buffer = noise;
        source.playbackRate.value = .72 + Math.random() * .65;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = 1300 + Math.random() * 2200;
        band.Q.value = .65 + Math.random() * .35;
        const high = ctx.createBiquadFilter();
        high.type = 'highpass';
        high.frequency.value = 820 + Math.random() * 500;
        const gain = ctx.createGain();
        const start = now + burst * .024 + Math.random() * .012;
        const level = (.14 + Math.random() * .06) * Math.max(.35, intensity);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + .006);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .075 + Math.random() * .035);
        source.connect(band);
        band.connect(high);
        high.connect(gain);
        gain.connect(output);
        source.start(start);
        source.stop(start + .14);
        source.onended = () => {
          source.disconnect();
          band.disconnect();
          high.disconnect();
          gain.disconnect();
        };
      }
    },
  };
}

function addTreeBend(scene, state) {
  const data = sceneData(scene);
  if (data.sultraTreeBend || !state.environment?.treeMap) return;
  const chunks = scene.chunks || [];
  const source = chunks.find((chunk) => chunk.geometry?.attributes?.position);
  if (!source) return;
  const Attribute = source.geometry.attributes.position.constructor;
  let matched = 0;
  for (const chunk of chunks) {
    const position = chunk.geometry?.attributes?.position;
    if (!position || chunk.geometry.attributes.aTree) continue;
    const values = position.array;
    const treeValues = new Float32Array(position.count * 4);
    for (let i = 0; i < position.count; i++) {
      const tree = state.environment.trees[state.environment.treeMap.get(treeKey(
        values[i * 3], values[i * 3 + 1], values[i * 3 + 2],
      ))];
      if (!tree) continue;
      treeValues[i * 4] = tree.x;
      treeValues[i * 4 + 1] = tree.y;
      treeValues[i * 4 + 2] = tree.z;
      treeValues[i * 4 + 3] = tree.height;
      matched++;
    }
    chunk.geometry.setAttribute('aTree', new Attribute(treeValues, 4));
  }
  if (!matched) return;
  const bend = `
if (aTree.w > 0.0) {
  vec2 treeOffset = aTree.xz - playerPos.xz;
  float treeDistance = length(treeOffset);
  float treeInfluence = 1.0 - smoothstep(0.65, 3.2, treeDistance);
  float treeHeight = clamp((transformed.y - aTree.y) / aTree.w, 0.0, 1.0);
  float treeAmount = 0.34 * treeInfluence * treeHeight * treeHeight;
  treeAmount *= 1.0 + 0.16 * sin(time * 9.0 + aTree.x * 0.7 + aTree.z * 0.5);
  if (treeDistance > 0.0001) transformed.xz += (treeOffset / treeDistance) * treeAmount;
}
`;
  const materials = new Set(chunks.map((chunk) => chunk.material).filter(Boolean));
  let patched = 0;
  for (const material of materials) {
    if (material.userData?.sultraTreeBend || !material.uniforms?.playerPos
      || !material.vertexShader?.includes('#include <project_vertex>')) continue;
    let shader = material.vertexShader;
    if (!shader.includes('attribute vec4 aTree;')) {
      const anchor = '#define PHONG\n';
      const declaration = 'attribute vec4 aTree;\n';
      shader = shader.includes(anchor) ? shader.replace(anchor, anchor + declaration) : declaration + shader;
    }
    if (!shader.includes('uniform vec3 playerPos;')) {
      const anchor = '#define PHONG\n';
      const declaration = 'uniform vec3 playerPos;\n';
      shader = shader.includes(anchor) ? shader.replace(anchor, anchor + declaration) : declaration + shader;
    }
    material.vertexShader = shader.replace('#include <project_vertex>', `${bend}\n#include <project_vertex>`);
    material.userData.sultraTreeBend = true;
    material.needsUpdate = true;
    patched++;
  }
  if (!patched) return;
  data.sultraTreeBend = true;
  data.sultraTreeVertices = matched;
}

function addBushRustle(scene, state) {
  const data = sceneData(scene);
  if (data.sultraBushRustle || !state.environment?.bushMap) return;
  const chunks = scene.chunks || [];
  const source = chunks.find((chunk) => chunk.geometry?.attributes?.position);
  if (!source) return;
  const Attribute = source.geometry.attributes.position.constructor;
  let matched = 0;
  for (const chunk of chunks) {
    const position = chunk.geometry?.attributes?.position;
    if (!position || chunk.geometry.attributes.aBush) continue;
    const values = position.array;
    const bushValues = new Float32Array(position.count * 4);
    for (let i = 0; i < position.count; i++) {
      const bush = state.environment.bushes[state.environment.bushMap.get(treeKey(
        values[i * 3], values[i * 3 + 1], values[i * 3 + 2],
      ))];
      if (!bush) continue;
      bushValues[i * 4] = bush.x;
      bushValues[i * 4 + 1] = bush.y;
      bushValues[i * 4 + 2] = bush.z;
      bushValues[i * 4 + 3] = bush.height;
      matched++;
    }
    chunk.geometry.setAttribute('aBush', new Attribute(bushValues, 4));
  }
  if (!matched) return;
  const rustle = `
if (aBush.w > 0.0) {
  vec2 bushOffset = aBush.xz - playerPos.xz;
  float bushDistance = length(bushOffset);
  float bushInfluence = 1.0 - smoothstep(0.15, 1.55, bushDistance);
  float bushHeight = clamp((transformed.y - aBush.y) / aBush.w, 0.0, 1.0);
  float bushPhase = time * 19.0 + aBush.x * 2.3 + aBush.z * 1.7;
  float bushSway = sin(bushPhase + transformed.x * 5.4 + transformed.z * 4.2);
  float bushCross = cos(bushPhase * 0.77 - transformed.x * 3.6 + transformed.z * 6.1);
  float bushAmount = bushInfluence * (0.35 + bushHeight * 0.65) * 0.085;
  transformed.x += bushSway * bushAmount;
  transformed.z += bushCross * bushAmount;
  transformed.y += sin(bushPhase * 1.43) * bushInfluence * bushHeight * 0.022;
}
`;
  const materials = new Set(chunks.map((chunk) => chunk.material).filter(Boolean));
  let patched = 0;
  for (const material of materials) {
    if (material.userData?.sultraBushRustle || !material.uniforms?.playerPos
      || !material.vertexShader?.includes('#include <project_vertex>')) continue;
    let shader = material.vertexShader;
    if (!shader.includes('attribute vec4 aBush;')) {
      const anchor = '#define PHONG\n';
      const declaration = 'attribute vec4 aBush;\n';
      shader = shader.includes(anchor) ? shader.replace(anchor, anchor + declaration) : declaration + shader;
    }
    if (!shader.includes('uniform vec3 playerPos;')) {
      const anchor = '#define PHONG\n';
      const declaration = 'uniform vec3 playerPos;\n';
      shader = shader.includes(anchor) ? shader.replace(anchor, anchor + declaration) : declaration + shader;
    }
    material.vertexShader = shader.replace('#include <project_vertex>', `${rustle}\n#include <project_vertex>`);
    material.userData.sultraBushRustle = true;
    material.needsUpdate = true;
    patched++;
  }
  if (!patched) return;
  data.sultraBushRustle = true;
  data.sultraBushVertices = matched;
}

function updateTreeContacts(state, position) {
  const trees = state.environment?.trees;
  if (!trees?.length) return;
  const contacts = state.treeContacts;
  let entered = false;
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    const dx = position.x - tree.x;
    const dz = position.z - tree.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq <= 1.21) {
      if (!contacts.has(i)) {
        contacts.add(i);
        entered = true;
      }
    } else if (distanceSq > 4.84) {
      contacts.delete(i);
    }
  }
  if (entered && state.treeContactsReady) state.treeAudio.play();
  state.treeContactsReady = true;
}

function updateBushContacts(state, position) {
  const bushes = state.environment?.bushes;
  if (!bushes?.length) return;
  const contacts = state.bushContacts;
  const last = state.bushLastPosition;
  const moving = last ? Math.hypot(position.x - last.x, position.z - last.z) > .002 : false;
  let entered = false;
  let inside = false;
  for (let i = 0; i < bushes.length; i++) {
    const bush = bushes[i];
    const dx = position.x - bush.x;
    const dz = position.z - bush.z;
    const distanceSq = dx * dx + dz * dz;
    const contact = Math.min(1.6, Math.max(.85, bush.radius * .8));
    if (distanceSq <= contact * contact) {
      inside = true;
      if (!contacts.has(i)) {
        contacts.add(i);
        entered = true;
      }
    } else if (distanceSq > (contact + .55) * (contact + .55)) {
      contacts.delete(i);
    }
  }
  if (state.bushContactsReady && (entered || (inside && moving))) {
    state.bushAudio.play(inside ? 1 : .7);
  }
  state.bushContactsReady = true;
  last.copy(position);
}

function addRockColliders(scene, state) {
  const data = sceneData(scene);
  if (!state.environment?.rockGeometry || !scene.physics?.isReady
    || data.sultraRockPhysics === scene.physics) return;
  const entries = [];
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const matrix = new Matrix4();
  const up = new Vector3(0, 1, 0);
  for (const rock of layout.decor || []) {
    if (rock.asset !== 'RockA') continue;
    const baseScale = rock.scale ?? 1;
    scale.set(
      rock.scaleXYZ?.[0] ?? baseScale,
      rock.scaleXYZ?.[1] ?? baseScale,
      rock.scaleXYZ?.[2] ?? baseScale,
    );
    position.set(rock.x, GROUND + ((rock.y ?? GROUND) - GROUND), rock.z);
    rotation.setFromAxisAngle(up, rock.rotation ?? 0);
    matrix.compose(position, rotation, scale);
    const geometry = state.environment.rockGeometry.clone();
    geometry.applyMatrix4(matrix);
    entries.push([geometry, 'props']);
  }
  if (!entries.length) return;
  scene.physics.addBatch(entries);
  for (const [geometry] of entries) geometry.dispose();
  data.sultraRockPhysics = scene.physics;
}


function addBarBox(target, x, y, z, sizeX, sizeY, sizeZ, yaw = 0) {
  const halfX = sizeX / 2;
  const halfY = sizeY / 2;
  const halfZ = sizeZ / 2;
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  const local = [
    [-halfX, -halfY, -halfZ], [halfX, -halfY, -halfZ], [halfX, halfY, -halfZ], [-halfX, halfY, -halfZ],
    [-halfX, -halfY, halfZ], [halfX, -halfY, halfZ], [halfX, halfY, halfZ], [-halfX, halfY, halfZ],
  ];
  const corners = local.map(([lx, ly, lz]) => [
    x + lx * cosine + lz * sine, y + ly, z - lx * sine + lz * cosine,
  ]);
  const triangles = [
    0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5, 3, 7, 6, 3, 6, 2, 0, 1, 5, 0, 5, 4,
  ];
  for (const index of triangles) {
    const corner = corners[index];
    target.push(corner[0], corner[1], corner[2]);
  }
}

function addRopeSpan(target, baseY, fromX, fromZ, toX, toZ, height) {
  const steps = 4;
  const sag = .07;
  let previousX = fromX;
  let previousY = baseY + height;
  let previousZ = fromZ;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = fromX + (toX - fromX) * t;
    const z = fromZ + (toZ - fromZ) * t;
    const y = baseY + height - sag * 4 * t * (1 - t);
    const dx = x - previousX;
    const dz = z - previousZ;
    const length = Math.hypot(dx, dz);
    if (length > .001) {
      addBarBox(target, (previousX + x) / 2, (previousY + y) / 2, (previousZ + z) / 2,
        .055, .055, length, Math.atan2(dx, dz));
    }
    previousX = x;
    previousY = y;
    previousZ = z;
  }
}

function monumentOutline(site, padding) {
  const halfWidth = site.width / 2 + padding;
  const halfDepth = site.depth / 2 + padding;
  const cosine = Math.cos(site.rotation || 0);
  const sine = Math.sin(site.rotation || 0);
  const point = (localX, localZ) => [
    site.x + localX * cosine + localZ * sine,
    site.z - localX * sine + localZ * cosine,
  ];
  const stepsX = Math.max(1, Math.ceil((halfWidth * 2) / 2.8));
  const stepsZ = Math.max(1, Math.ceil((halfDepth * 2) / 2.4));
  const points = [];
  for (let i = 0; i < stepsX; i++) points.push(point(-halfWidth + (halfWidth * 2 * i) / stepsX, -halfDepth));
  for (let i = 0; i < stepsZ; i++) points.push(point(halfWidth, -halfDepth + (halfDepth * 2 * i) / stepsZ));
  for (let i = 0; i < stepsX; i++) points.push(point(halfWidth - (halfWidth * 2 * i) / stepsX, halfDepth));
  for (let i = 0; i < stepsZ; i++) points.push(point(-halfWidth, halfDepth - (halfDepth * 2 * i) / stepsZ));
  return points;
}

function addMonumentBarriers(scene, state) {
  const group = state.houses;
  if (!group) return;
  const data = group.userData || (group.userData = {});
  data.sultraRopeBarriers ??= new Set();
  const source = state.environment?.rockGeometry
    || scene.chunks?.find((chunk) => chunk.geometry?.attributes?.position)?.geometry;
  const position = source?.attributes?.position;
  if (!position) return;
  const Attribute = position.constructor;
  const postVertices = [];
  const ropeVertices = [];
  const postHeight = 1.12;
  // Tiny procedural ropes mark the solid boundary even if the HD monument is
  // still downloading, so a slow connection never creates an invisible wall.
  for (const site of layout.monuments || []) {
    if (data.sultraRopeBarriers.has(site.id)) continue;
    data.sultraRopeBarriers.add(site.id);
    const baseY = GROUND + .02;
    const posts = monumentOutline(site, .65);
    for (const [x, z] of posts) {
      addBarBox(postVertices, x, baseY + postHeight / 2, z, .14, postHeight, .14);
    }
    for (let i = 0; i < posts.length; i++) {
      const from = posts[i];
      const to = posts[(i + 1) % posts.length];
      addRopeSpan(ropeVertices, baseY, from[0], from[1], to[0], to[1], .46);
      addRopeSpan(ropeVertices, baseY, from[0], from[1], to[0], to[1], .88);
    }
  }
  if (!postVertices.length) return;
  const barrier = new Group();
  barrier.name = 'Sultra rope barriers';
  const postGeometry = new BufferGeometry();
  postGeometry.setAttribute('position', new Attribute(new Float32Array(postVertices), 3));
  const ropeGeometry = new BufferGeometry();
  ropeGeometry.setAttribute('position', new Attribute(new Float32Array(ropeVertices), 3));
  barrier.add(new Mesh(postGeometry, new MeshBasicMaterial({ color: 0x5b3724, toneMapped: false })));
  barrier.add(new Mesh(ropeGeometry, new MeshBasicMaterial({ color: 0xd3a24d, toneMapped: false })));
  group.add(barrier);
}

function addMonumentColliders(scene, state) {
  const data = sceneData(scene);
  if (!state.houses || !scene.physics?.isReady
    || data.sultraMonumentPhysics === scene.physics) return;
  const source = state.environment?.rockGeometry
    || scene.chunks?.find((chunk) => chunk.geometry?.attributes?.position)?.geometry;
  const position = source?.attributes?.position;
  if (!position) return;
  const Attribute = position.constructor;
  const entries = [];
  // Collision footprints are tiny layout data and stay ready independently of
  // HD downloads. Streaming never removes the ground or physical boundaries.
  for (const site of layout.monuments || []) {
    const vertices = [];
    addBarBox(vertices, site.x, GROUND + site.height / 2, site.z,
      site.width + .1, site.height, site.depth + .1, site.rotation || 0);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    entries.push([geometry, 'props']);
  }
  if (!entries.length) return;
  scene.physics.addBatch(entries);
  for (const [geometry] of entries) geometry.dispose();
  data.sultraMonumentPhysics = scene.physics;
}

function ensureEnvironment(scene, state) {
  const player = scene.player?.base?.position;
  if (player) {
    for (const chunk of scene.chunks || []) {
      const uniform = chunk.material?.uniforms?.playerPos?.value;
      if (uniform) uniform.copy(player);
    }
  }
  if (!state.environment) return;
  if (!sceneData(scene).sultraTreeBend) addTreeBend(scene, state);
  if (!sceneData(scene).sultraBushRustle) addBushRustle(scene, state);
  addRockColliders(scene, state);
  addMonumentColliders(scene, state);
  addMonumentBarriers(scene, state);
}

function registerGuides(game) {
  const actors = {};
  const colors = [22, 23, 25, 19, 21, 24];
  for (const [index, site] of layout.guides.entries()) {
    const content = CULTURE_GUIDES.find((entry) => entry.id === site.id);
    if (!content) continue;
    const subtype = guideSubtype(site.id);
    game.app.$characters.npcs[subtype] = {
      gradientID: colors[index % colors.length], face: index % 2,
      head: null, body: null, bottom: 'Bottom-Sandals',
      script: 'TalkingCitizen', scriptArgs: { animation: 'Idle2' },
    };
    registerSultraGuideDialog(game, subtype, content, { guideBit: 1 << index });
    const uid = guideUID(site.id);
    actors[uid] = {
      uid, type: 'NPC', params: { subtype, move: `radius=${site.wanderRadius ?? 3},pausemin=0.8,pausemax=2.4,speed=1.7` },
      transforms: transform(site.x, GROUND, site.z, site.rotation),
    };
  }
  return actors;
}

function monumentApproach(site) {
  const anchor = site.connector?.[0] || [site.x, site.z + 8];
  let dx = anchor[0] - site.x;
  let dz = anchor[1] - site.z;
  const length = Math.hypot(dx, dz) || 1;
  return { dx: dx / length, dz: dz / length };
}

function monumentVisitPoint(site) {
  const { dx, dz } = monumentApproach(site);
  const distance = Math.max(site.width, site.depth) / 2 + 4.2;
  return { x: site.x + dx * distance, z: site.z + dz * distance };
}

function monumentGuidePosition(site) {
  const { dx, dz } = monumentApproach(site);
  const forward = Math.max(site.width, site.depth) / 2 + 2.1;
  const side = 1.1;
  return {
    x: site.x + dx * forward - dz * side,
    z: site.z + dz * forward + dx * side,
  };
}

function registerMonumentGuides(game) {
  const actors = {};
  const colors = [23, 25];
  const heads = ['Head-Visor', 'Head-FrenchBeret'];
  for (const [index, site] of (layout.monuments || []).entries()) {
    const content = MONUMENT_GUIDES[site.id];
    if (!content) continue;
    const subtype = `SultraInfo_${site.id.replace(/-/g, '_')}`;
    game.app.$characters.npcs[subtype] = {
      gradientID: colors[index % colors.length], face: index % 2,
      head: heads[index % heads.length], body: null, bottom: 'Bottom-Sandals',
      script: 'TalkingCitizen', scriptArgs: { animation: 'Idle2' },
    };
    registerSultraGuideDialog(game, subtype, content, { monumentId: site.id });
    const position = monumentGuidePosition(site);
    const uid = `NPC_SultraInfo_${site.id}`;
    actors[uid] = {
      uid, type: 'NPC', params: { subtype },
      transforms: transform(position.x, GROUND, position.z,
        Math.atan2(site.x - position.x, site.z - position.z)),
    };
  }
  return actors;
}

function loadMonumentGuideModel(game, state) {
  if (state.guideNpcModel) return;
  const load = (url) => assets.load(url, { noCache: true });
  state.guideNpcRequest ??= load(assetUrl(MONUMENT_GUIDE_MODEL))
    // Older dev/build servers predate this file's cache manifest entry; the
    // plain public URL still serves it, so keep the swap working there too.
    .catch(() => load(MONUMENT_GUIDE_MODEL))
    .then((gltf) => {
      convertMaterials(gltf.scene, { preserveBakedColors: true });
      state.guideNpcModel = gltf.scene;
    })
    .catch((error) => {
      console.error('[Sultrarupa island] monument guide model', error);
      state.guideNpcRequest = null;
    });
}

// Swap the two monument guides' procedural citizens for the sculpted model.
// The native rig stays in the tree (dialog, interaction and camera logic keep
// using it) but is hidden once this model is attached.
function attachMonumentGuideNpcs(scene, state) {
  const model = state.guideNpcModel;
  if (!model) return;
  // Cache the two guide actors; the per-frame path must stay O(2).
  if (state.guideNpcScene !== scene) {
    state.guideNpcScene = scene;
    state.guideNpcActors = Object.entries(scene.actors || {})
      .filter(([uid]) => uid.startsWith(MONUMENT_NPC_PREFIX))
      .map(([, actor]) => actor);
  }
  for (const actor of state.guideNpcActors || []) {
    if (!actor?.base) continue;
    if (actor.sultraGuideModel) {
      // The procedural citizen can finish building after the first swap, so
      // hide every native child on every frame and re-attach ours if the
      // scene rebuilds its children.
      if (actor.sultraGuideModel.parent !== actor.base) actor.base.add(actor.sultraGuideModel);
      for (const child of actor.base.children) {
        if (child !== actor.sultraGuideModel) child.visible = false;
      }
      continue;
    }
    for (const child of actor.base.children) child.visible = false;
    const guide = model.clone(true);
    guide.name = 'Sultrarupa monument guide NPC';
    // Scene actors keep a 0.01 root scale (the native citizen is scaled up
    // 100x inside it), so size the sculpt against its own raw bounds instead
    // of trusting the file's 1.9 m height.
    if (!state.guideNpcSourceHeight) {
      model.updateWorldMatrix(true, true);
      const bounds = new Box3().setFromObject(model);
      state.guideNpcSourceHeight = Math.max(.001, bounds.max.y - bounds.min.y);
    }
    const baseScale = Math.abs(actor.base.scale.x) || 1;
    guide.scale.setScalar(MONUMENT_GUIDE_HEIGHT / (state.guideNpcSourceHeight * baseScale));
    actor.sultraGuideModel = guide;
    actor.base.add(guide);
    actor.base.updateMatrixWorld(true);
  }
}

function updateMonumentGuideNpcs(game, scene, state, player) {
  if (state.guideNpcModel) {
    attachMonumentGuideNpcs(scene, state);
    for (const actor of state.guideNpcActors || []) {
      if (!actor.sultraGuideModel || !player) continue;
      actor.sultraFacing ??= { rest: actor.baseQuaternion.clone(), current: actor.baseQuaternion.clone(), target: new Quaternion() };
      const facing = actor.sultraFacing;
      const talking = actor.isTalking || game.app.$dialogs.current?.speaker === actor;
      if (talking) facing.target.setFromAxisAngle(GUIDE_UP, Math.atan2(player.x - actor.base.position.x, player.z - actor.base.position.z));
      else facing.target.copy(facing.rest);
      facing.current.slerp(facing.target, 1 - Math.exp(-Math.min(game.time.dt / 1000, .05) * 8));
      actor.base.quaternion.copy(facing.current);
      actor.base.updateMatrix();
      actor.base.updateMatrixWorld(true);
    }
    return;
  }
  if (state.guideNpcRequest || !player) return;
  for (const site of layout.monuments || []) {
    if (!MONUMENT_GUIDES[site.id]) continue;
    const position = monumentGuidePosition(site);
    const dx = player.x - position.x;
    const dz = player.z - position.z;
    if (dx * dx + dz * dz > MONUMENT_GUIDE_LOAD_RADIUS ** 2) continue;
    loadMonumentGuideModel(game, state);
    return;
  }
}

function registerJoggers(game) {
  const actors = {};
  const colors = [22, 23, 24, 25];
  for (const route of JOGGER_PATHS) {
    const subtype = `SultraJogger_${route.index}`;
    game.app.$characters.npcs[subtype] = {
      gradientID: colors[route.index % colors.length], face: route.index % 2,
      head: 'Head-Heaset', body: null, bottom: 'Bottom-FastShoes',
      script: 'PassiveCitizen', scriptArgs: { animation: 'Run' },
    };
    const start = route.points[0];
    const next = route.points[1];
    actors[route.uid] = {
      uid: route.uid, type: 'NPC',
      params: {
        subtype,
        move: `curve=SultraJoggerCurve_${route.index}, run, pauseMin=0, pauseMax=0, speed=${route.speed}`,
      },
      transforms: transform(start[0], GROUND, start[1],
        Math.atan2(next[0] - start[0], next[1] - start[1])),
    };
  }
  return actors;
}

function configureScenes(game, state) {
  if (state.configured) return;
  const manifest = game.app.$manifest.content;
  state.backup = {
    timestamp: manifest.timestamp,
    scenes: { [MAIN]: copy(manifest.scenes[MAIN]), [INTRO]: copy(manifest.scenes[INTRO]) },
    registry: { ...game.scenes.list },
    ao: { [MAIN]: manifest.ao[MAIN], [INTRO]: manifest.ao[INTRO] },
    savedScene: game.savestate.game.currentScene,
    teleportTo: game.scenes.teleportTo,
  };

  const mainTrees = forestProps(manifest);
  const introTrees = forestProps(manifest, true);
  const spawn = [...layout.spawn, 1, 1, 1, 0, 0, 0, 1];
  Object.assign(manifest.scenes[MAIN], {
    url: assetUrl('/models/culture/sulawesi-island.glb'),
    bounds: copy(layout.bounds), useBaseAsCollider: true,
    props: mainTrees, assets: [...new Set(mainTrees.map((entry) => entry.asset))],
    actors: { ...registerGuides(game), ...registerMonumentGuides(game), ...registerJoggers(game), ...registerLuloDancers(game, layout) },
    points: {
      'Spawn.001': spawn, 'PortSpawnA.001': [...spawn], 'PortSpawnB.001': [...spawn],
      ...cultureDestinationPoints(),
    },
    curves: Object.fromEntries(JOGGER_PATHS.map((route) => [`SultraJoggerCurve_${route.index}`, joggerCurve(route)])),
    areas: {},
  });

  // The opening boat and its guide keep their original animation and camera.
  const introActors = Object.fromEntries(Object.entries(manifest.scenes[INTRO].actors)
    .filter(([, actor]) => actor.type === 'NPC'
      && (actor.params?.subtype === 'Intro' || actor.className === 'NPCIntro'
        || game.app.$characters.npcs[actor.params?.subtype]?.script === 'Intro')));
  Object.assign(manifest.scenes[INTRO], {
    url: assetUrl('/models/culture/sulawesi-intro.glb'),
    bounds: copy(layout.introBounds), useBaseAsCollider: true,
    props: introTrees, assets: [...new Set(introTrees.map((entry) => entry.asset))],
    actors: introActors, curves: {}, areas: {},
  });
  delete manifest.ao[MAIN];
  delete manifest.ao[INTRO];
  for (const id of SCENES) {
    manifest.textures[`Scene_${id}_TerrainSplatting`] = { default: assetUrl('/models/culture/terrain-splat.png') };
    manifest.textures[`Scene_${id}_GrassSplatting`] = { default: assetUrl('/models/culture/grass-splat.png') };
  }
  // Invalidate persistent asset caches when regenerated terrain/masks change.
  manifest.timestamp = Number(state.backup.timestamp) + 2026101302;

  // The bundled merge cache omits vertex colors. Preserve native cache behavior
  // for other resources while always reading the two colored terrain GLBs.
  const cache = game.resources.supercache;
  const originalGet = cache.get.bind(cache), originalAdd = cache.add.bind(cache);
  const isTerrainCache = (key) => key === `${MAIN}.merge.dat` || key === `${INTRO}.merge.dat`;
  cache.get = (key, options) => isTerrainCache(key) ? Promise.resolve(false) : originalGet(key, options);
  cache.add = (key, value) => isTerrainCache(key) ? Promise.resolve() : originalAdd(key, value);

  for (const id of Object.keys(game.scenes.list)) {
    if (!SCENES.has(id)) delete game.scenes.list[id];
  }
  game.savestate.game.currentScene = MAIN;
  game.app.$store.overrideSpawnPoint = null;
  // Only the old world's coordinates need migration; outfits and progress stay.
  try {
    if (localStorage.getItem('sultrarupa-island-layout') !== '2') {
      state.backup.playerPosition = localStorage.getItem('player_position');
      localStorage.setItem('player_position', [MAIN, ...layout.spawn, 0, 0, 0].join('|'));
      localStorage.setItem('sultrarupa-island-layout', '2');
    }
  } catch {
    // The regular Spawn point also works when browser storage is unavailable.
  }
  const teleport = state.backup.teleportTo;
  game.scenes.teleportTo = (id, options = {}) => {
    if (!SCENES.has(id)) return teleport(MAIN, { ...options, point: 'Spawn' });
    const pointExists = id !== MAIN || !options.point || Object.keys(manifest.scenes[MAIN].points)
      .some((name) => name.split('.')[0] === options.point);
    return teleport(id, pointExists ? options : { ...options, point: 'Spawn' });
  };
  state.configured = true;
}

async function loadHouse(state, id) {
  const exhibits = [...HOUSE_EXHIBITS, ...(layout.monuments || [])];
  const entry = exhibits.find(item => item.id === id);
  if (!entry || state.templates.has(id)) return;
  const gltf = await assets.load(assetUrl(entry.model), { noCache: true });
  convertMaterials(gltf.scene, { preserveBakedColors: true });
  if (entry.unlit) gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    // Diffuse color from the PBR source is displayed directly, without baked
    // directional shading, scene lighting, tone mapping or fog dimming it.
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.color.set(0xffffff);
      material.fog = false;
      material.toneMapped = false;
      if (material.map) {
        // This legacy renderer presents display-encoded colors directly.
        // Its r150 texture API uses encoding; colorSpace alone has no effect.
        // Avoid decoding sRGB into a linear framebuffer with no output encode.
        material.map.encoding = 3000; // THREE.LinearEncoding in the bundle.
        material.map.needsUpdate = true;
      }
      material.needsUpdate = true;
    }
  });
  gltf.scene.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(gltf.scene);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const normalized = new Group();
  normalized.name = entry.title;
  gltf.scene.position.x -= center.x;
  gltf.scene.position.y -= bounds.min.y;
  gltf.scene.position.z -= center.z;
  normalized.add(gltf.scene);
  state.templates.set(entry.id, { object: normalized, size });
}

function addHouses(scene, state) {
  const preview = scene.id === INTRO;
  const offset = preview ? layout.introTransform : { scale: 1, x: 0, z: 0 };
  const first = !state.houses;
  const group = state.houses || new Group();
  group.name = preview ? 'Sultrarupa opening island houses' : 'Sultrarupa traditional houses';
  const targets = [];
  const interactiveHouses = [];
  if (first) {
    state.attachedModels = new Set();
    if (!preview) state.arrivalFocus.clear();
  }
  for (const site of layout.houses) {
    const source = state.templates.get(site.id);
    const content = HOUSE_EXHIBITS.find((entry) => entry.id === site.id);
    if (first && !preview && content) targets.push({
      ...content, kind: 'house',
      position: new Vector3(site.entrance?.x ?? site.x, GROUND + 2.1, site.entrance?.z ?? site.z),
    });
    if (!source || !content || state.attachedModels.has(site.id)) continue;
    state.attachedModels.add(site.id);
    const house = source.object.clone(true);
    const scale = (site.depth ?? 18) / source.size.z;
    house.scale.setScalar(scale * offset.scale);
    house.rotation.y = site.rotation || 0;
    house.position.set(site.x * offset.scale + offset.x, GROUND, site.z * offset.scale + offset.z);
    house.userData.exhibit = site.id;
    group.add(house);
    if (!preview) {
      interactiveHouses.push({ id: site.id, object: house });
      state.arrivalFocus.set(site.id, {
        x: site.x * offset.scale + offset.x,
        z: site.z * offset.scale + offset.z,
        y: GROUND + Math.max(3.4, source.size.y * scale * offset.scale * .55),
        distance: 2.9 + source.size.y * scale * offset.scale * .28,
        radius: source.size.length() * scale * offset.scale * .5,
      });
    }
  }
  for (const site of layout.monuments || []) {
    const source = state.templates.get(site.id);
    if (!source || state.attachedModels.has(site.id)) continue;
    state.attachedModels.add(site.id);
    const monument = source.object.clone(true);
    monument.name = site.title;
    // Height and footprint are independent: the MTQ tower stands on a narrow
    // coastal strip, so it grows taller without widening past the shoreline.
    monument.scale.set(
      site.width / source.size.x * offset.scale,
      site.height / source.size.y * offset.scale,
      site.depth / source.size.z * offset.scale,
    );
    monument.rotation.y = site.rotation || 0;
    monument.position.set(site.x * offset.scale + offset.x, GROUND, site.z * offset.scale + offset.z);
    monument.userData.landmark = site.id;
    group.add(monument);
    if (!preview) {
      const height = site.height * offset.scale;
      state.arrivalFocus.set(site.id, {
        x: site.x * offset.scale + offset.x,
        z: site.z * offset.scale + offset.z,
        y: GROUND + height * .55,
        distance: Math.max(5.4, height * .5),
        radius: Math.hypot(site.width, site.height, site.depth) * offset.scale * .5,
      });
    }
  }
  if (first) scene.base.add(group);
  group.updateMatrixWorld(true);
  state.houses = group;
  if (first && !preview) {
    state.guideTargets = [];
    for (const site of layout.guides) {
      const content = CULTURE_GUIDES.find((entry) => entry.id === site.id);
      if (!content) continue;
      const target = { ...content, kind: 'guide', position: new Vector3(site.x, GROUND + 3.3, site.z) };
      targets.push(target);
      state.guideTargets.push({ target, uid: guideUID(site.id) });
      state.arrivalFocus.set(site.id, { x: site.x, z: site.z, y: GROUND + 1.7, distance: 5.6 });
    }
    const lulo = CULTURE_GUIDES.find((entry) => entry.id === 'lulo');
    targets.push({ ...lulo, id: 'lulo-stage', title: 'Lulo', kind: 'guide', worldMarker: 'music',
      position: new Vector3(layout.stage.speakers.x, GROUND + 2.1, layout.stage.speakers.z + 3) });
    if (layout.stage) {
      const stage = layout.stage.speakers || layout.stage.dance || layout.stage;
      state.arrivalFocus.set('lulo-stage', { x: stage.x, z: stage.z, y: GROUND + 2.1, distance: 6.2 });
    }
    state.ui.setTargets(targets);
  }
  if (!preview && interactiveHouses.length) state.houseInteraction.setHouses(interactiveHouses, { append: true });
}

function attachScene(scene, state) {
  if (state.interior?.isOpen) state.interior.close({ reason: 'scene', restoreFocus: false });
  state.houseInteraction.clear();
  state.ui.clear();
  for (const child of state.houses?.children || []) {
    if (child.name === 'Sultra rope barriers') child.traverse(object => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
  }
  state.houses?.removeFromParent();
  state.houses = null;
  state.guideTargets = [];
  state.treeContacts.clear();
  state.treeContactsReady = false;
  state.bushContacts.clear();
  state.bushContactsReady = false;
  state.scene = scene;
  if (!SCENES.has(scene.id)) return;
  // Keep the original terrain shader, shoreline shading, shadows and wind grass.
  if (state.status === 'ready') addHouses(scene, state);
}

export function installSultraIsland(game) {
  if (game.sultraIsland) return game.sultraIsland;
  const state = game.sultraIsland = {
    status: 'loading', configured: false, backup: null,
    templates: new Map(), scene: null, houses: null, guideTargets: [],
    arrivalFocus: new Map(), arrival: null,
    environment: null, treeContacts: new Set(), treeContactsReady: false,
    bushContacts: new Set(), bushContactsReady: false, bushLastPosition: new Vector3(),
    guideNpcModel: null, guideNpcRequest: null, guideNpcScene: null, guideNpcActors: null, guideNpcSourceHeight: 0,
    treeAudio: createTreeTuning(game), bushAudio: createBushTuning(game),
  };
  state.models = createModelStream([...layout.houses, ...(layout.monuments || [])], id => loadHouse(state, id));
  const streamPosition = new Vector3();
  const houseBits = new Map((layout.houses || []).map((site, index) => [site.id, 1 << index]));
  function setVariable(name, value) {
    const vars = game.savestate?.game?.vars;
    if (vars && vars[name] !== value) vars[name] = value;
  }
  function addMask(name, bit) {
    const vars = game.savestate?.game?.vars;
    if (vars && !(Number(vars[name]) & bit)) vars[name] = (Number(vars[name]) || 0) | bit;
  }
  function markCulture(id, kind) {
    if (kind === 'house') {
      const bit = houseBits.get(id);
      if (bit) addMask('sultraHouseMask', bit);
    }
  }
  function markOutfit() {
    const player = game.savestate?.game?.player;
    if (player && (player.head !== 'Head-Empty' || player.body !== 'Body-Empty'
      || player.bottom !== 'Bottom-Empty')) setVariable('isSultraDressedUp', true);
  }
  state.ui = createCultureUI({
    onOpenChange(open, { target, presentation } = {}) {
      if (open && state.interior?.isOpen) state.interior.close({ reason: 'ui', restoreFocus: false });
      game.input?.keyboard?.unpressAllKeys();
      const scene = game.scenes?.current;
      if (scene?.id !== MAIN) return;
      if (open && target) markCulture(target.id, target.kind);
      if (open && presentation === 'house-dialog') state.houseInteraction?.focus(target.id);
      else state.houseInteraction?.clearFocus();
      if (open && target) state.voice?.setTarget(target, { autoplay: presentation === 'house-dialog' });
      else state.voice?.clear();
      scene.physics.movePlayer(new Vector3());
      scene.physics.togglePause(open || Boolean(game.store.onPhone?.value));
    },
    onStoryPage(target, page, total) {
      if (target?.kind === 'house' && page >= total - 1) setVariable('isSultraStoryFinished', true);
    },
  });
  state.interior = createLazyHouseInterior(game, {
    ui: state.ui,
    onEnter(target) {
      game.input?.keyboard?.unpressAllKeys();
      markCulture(target.id, 'house');
      state.voice?.clear();
      const scene = game.scenes?.current;
      if (scene?.id !== MAIN) return;
      state.houseInteraction?.clearFocus();
      scene.physics.movePlayer(new Vector3());
      scene.physics.togglePause(true);
    },
    onExit() {
      game.input?.keyboard?.unpressAllKeys();
      const scene = game.scenes?.current;
      if (!scene?.physics) return;
      scene.physics.togglePause(Boolean(state.ui?.isOpen) || Boolean(game.store.onPhone?.value));
    },
  });
  state.houseInteraction = createHouseInteractions(game, state.ui, state.interior);
  state.voice = createCultureVoice(game);
  state.ui.setNarrationControls(state.voice.element);
  let navigationGeneration = 0, destinationNotice;
  state.phoneMap = installSultraPhoneMap(game, {
    navigateTo(id) {
      const point = culturePointName(id);
      const points = game.app?.$manifest?.content?.scenes?.[MAIN]?.points;
      if (!points?.[point] || !game.scenes?.teleportTo) return false;
      game.scenes.current?.playerCam?.removeTarget({ id: ARRIVAL_CAM_ID, instant: true });
      state.arrival = null;
      game.input?.keyboard?.unpressAllKeys();
      // Follow the phone map's built-in travel flow: leave the phone first,
      // then place the player at a named, safe destination point.
      game.app.$router?.push({ name: 'Home' });
      const generation = ++navigationGeneration;
      destinationNotice ??= document.createElement('div');
      destinationNotice.setAttribute('role', 'status');
      destinationNotice.textContent = 'Menyiapkan tujuanâ€¦';
      destinationNotice.style.cssText = 'position:fixed;z-index:90;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 20px;border-radius:16px;background:#34335a;color:white;pointer-events:none';
      document.body.append(destinationNotice);
      state.models.request(id, true).then(() => {
        if (generation !== navigationGeneration) return;
        game.scenes.teleportTo(MAIN, { point, delay: 400 });
        state.arrival = { id, since: performance.now(), applied: false };
      }).catch(error => {
        if (generation !== navigationGeneration) return;
        console.error('[Sultra destination]', error);
        window.alert('Tujuan belum berhasil dimuat. Periksa koneksi lalu pilih tujuan lagi.');
      }).finally(() => {
        if (generation === navigationGeneration) destinationNotice.remove();
      });
      return true;
    },
  });
  state.phoneCulture = installSultraPhoneCulture(game);
  state.lulo = installSultraLulo(game, layout);
  function preload() {
    if (state.ready) return;
    configureScenes(game, state);
    let origin = { x: layout.spawn[0], z: layout.spawn[2] };
    const returning = game.savestate.getVariable('isIntroCompleted');
    if (returning) {
      try {
        const [scene, x, , z] = (localStorage.getItem('player_position') || '').split('|');
        if (scene === MAIN && Number.isFinite(Number(x)) && Number.isFinite(Number(z))) origin = { x: Number(x), z: Number(z) };
      } catch { /* Native spawn remains available when storage is restricted. */ }
    }
    state.ready = Promise.all([
      // The opening boat starts offshore, beyond every site's streaming radius.
      // Its native scene/boat/character barrier is retained; coastal models start
      // as it approaches. Returning players need their nearest destination now.
      returning ? state.models.initial(origin.x, origin.z) : Promise.resolve(),
      loadEnvironment(game, state).catch((error) => {
        console.error('[Sultrarupa island] environment', error);
      }),
    ]).then(() => { state.status = 'ready'; }).catch((error) => {
      state.status = 'error';
      state.error = error;
      console.error('[Sultrarupa island]', error);
      throw error;
    });
    game.app.$preloader.task(state.ready, { graceful: false });
  }
  game.hooks.beforePreload.watch(preload);
  // Also supports installation into a live development session before teleport.
  if (game.resources?.manifest?.scenes) preload();
  game.hooks.beforeRender.watch(() => {
    const scene = game.scenes?.current;
    if (!scene?.base) return;
    if (state.scene !== scene) attachScene(scene, state);
    if (!SCENES.has(scene.id)) return;
    // The native low-quality fallback removes every blade. Keep a small patch
    // around the player; higher-quality devices retain the native larger field.
    if (scene.grass && game.store.grass.radius < .08) game.store.grass.radius = .08;
    if (state.status === 'ready' && (!state.houses || state.attachedModels.size < state.templates.size)) addHouses(scene, state);
    const positionReady = scene.id !== MAIN || (scene.physics?.isReady
      && scene.player?.isBodyReady && !game.store.isTransitionActive?.value);
    if (game.app.$preloader.hidden && positionReady) {
      const actor = scene.player || scene.npcIntro;
      if (actor?.base) {
        actor.base.getWorldPosition(streamPosition);
        if (scene.id === INTRO) {
          streamPosition.x = (streamPosition.x - layout.introTransform.x) / layout.introTransform.scale;
          streamPosition.z = (streamPosition.z - layout.introTransform.z) / layout.introTransform.scale;
        }
        state.models.update(streamPosition.x, streamPosition.z);
      }
    }
    if (scene.id !== MAIN) return;
    ensureEnvironment(scene, state);
    updateArrivalCamera(scene, state, performance.now());
    updateMonumentGuideNpcs(game, scene, state, scene.player?.base?.position);
    for (const { target, uid } of state.guideTargets) {
      const actor = scene.actors[uid];
      if (actor?.base) target.position.copy(actor.base.position).add(GUIDE_OFFSET);
    }
    const playerPosition = scene.player?.base?.position;
    if (playerPosition) {
      updateTreeContacts(state, playerPosition);
      updateBushContacts(state, playerPosition);
      markOutfit();
    }
    const camera = scene.getCurrentCamera()?.cam;
    if (camera && scene.player?.base) {
      const canInteract = scene.player.canMove && !state.interior.isOpen
        && !game.store.onPhone?.value && !game.store.inDialog?.value
        && !game.store.interactionButton?.value;
      state.ui.update(camera, scene.player.base.position, canInteract);
      state.houseInteraction.update(scene, camera, scene.player.base.position);
    }
  });
  return state;
}
