import layout from './sultra-island-layout.js';
import { HOUSE_EXHIBITS, CULTURE_GUIDES } from './sultra-culture-data.js';
import { createCultureUI } from './sultra-culture-ui.js';
import { installSultraPhoneMap } from './sultra-phone-map.js';
import { registerLuloDancers, installSultraLulo } from './sultra-lulo.js';
import { convertMaterials } from './opening-boat.js';
import {
  cD as assets, cd as Group, cx as Box3, aS as Vector3,
} from './vendor.75f6e6ae65453426.js';

const MAIN = 'IslandWest';
const INTRO = 'IslandIntro';
const SCENES = new Set([MAIN, INTRO]);
const GROUND = layout.groundY ?? 3;
const GUIDE_OFFSET = new Vector3(0, 3.3, 0);
const copy = (value) => JSON.parse(JSON.stringify(value));
const guideUID = (id) => `NPC_SultraGuide_${id}`;
const guideSubtype = (id) => `SultraGuide_${id}`;

function transform(x, y, z, rotation = 0, scale = 1) {
  return [x, y, z, scale, scale, scale, 0, Math.sin(rotation / 2), 0, Math.cos(rotation / 2)];
}

function forestProps(manifest, preview = false) {
  const offset = preview ? layout.introTransform : { x: 0, z: 0, scale: 1 };
  const scale = offset.scale ?? 1;
  return [...(layout.forest || []), ...(layout.decor || [])].flatMap((tree) => {
    // A missing optional native tree should never prevent the island loading.
    if (!manifest.assets[tree.asset]) return [];
    const transforms = transform(
      tree.x * scale + offset.x, tree.y ?? GROUND, tree.z * scale + offset.z,
      tree.rotation, (tree.scale ?? 1) * scale,
    );
    if (tree.scaleXYZ) tree.scaleXYZ.forEach((value, i) => { transforms[3 + i] = value * scale; });
    return [{
      asset: tree.asset,
      traversable: !['Wall', 'SpeakersOn'].includes(tree.asset),
      transforms,
    }];
  });
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
    const dialog = game.app.$dialogs.list[subtype] = {
      Start: {
        id: 'Start', isSpeak: true,
        bubble: `Selamat datang! Mari mengenal ${content.title}. ${content.facts[0]}`,
        before: [{ action: 'EMOTE', opts: ['Hello'] }],
        next: [{ action: 'GOTO', node: 'LearnMore' }],
      },
      LearnMore: {
        id: 'LearnMore', isSpeak: true,
        bubble: 'Pilih ikon pemandu di atas saya untuk membaca cerita dan sumbernya. Selamat menjelajah!',
        next: [{ action: 'END' }],
      },
    };
    Object.defineProperties(dialog, {
      __first__: { value: 'Start' },
      __id__: { value: subtype },
    });
    const uid = guideUID(site.id);
    actors[uid] = {
      uid, type: 'NPC', params: { subtype, move: `radius=${site.wanderRadius ?? 3},pausemin=0.8,pausemax=2.4,speed=1.7` },
      transforms: transform(site.x, GROUND, site.z, site.rotation),
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
    url: '/models/culture/sulawesi-island.glb',
    bounds: copy(layout.bounds), useBaseAsCollider: true,
    props: mainTrees, assets: [...new Set(mainTrees.map((entry) => entry.asset))],
    actors: { ...registerGuides(game), ...registerLuloDancers(game, layout) },
    points: { 'Spawn.001': spawn, 'PortSpawnA.001': [...spawn], 'PortSpawnB.001': [...spawn] },
    curves: {}, areas: {},
  });

  // The opening boat and its guide keep their original animation and camera.
  const introActors = Object.fromEntries(Object.entries(manifest.scenes[INTRO].actors)
    .filter(([, actor]) => actor.type === 'NPC'
      && (actor.params?.subtype === 'Intro' || actor.className === 'NPCIntro'
        || game.app.$characters.npcs[actor.params?.subtype]?.script === 'Intro')));
  Object.assign(manifest.scenes[INTRO], {
    url: '/models/culture/sulawesi-intro.glb',
    bounds: copy(layout.introBounds), useBaseAsCollider: true,
    props: introTrees, assets: [...new Set(introTrees.map((entry) => entry.asset))],
    actors: introActors, curves: {}, areas: {},
  });
  delete manifest.ao[MAIN];
  delete manifest.ao[INTRO];
  for (const id of SCENES) {
    manifest.textures[`Scene_${id}_TerrainSplatting`] = { default: '/models/culture/terrain-splat.png' };
    manifest.textures[`Scene_${id}_GrassSplatting`] = { default: '/models/culture/grass-splat.png' };
  }
  manifest.timestamp = Number(state.backup.timestamp) + 20261005;

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
    if (localStorage.getItem('sultrarupa-island-layout') !== '1') {
      state.backup.playerPosition = localStorage.getItem('player_position');
      localStorage.setItem('player_position', [MAIN, ...layout.spawn, 0, 0, 0].join('|'));
      localStorage.setItem('sultrarupa-island-layout', '1');
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

async function loadHouses(state) {
  await Promise.all(HOUSE_EXHIBITS.map(async (entry) => {
    const gltf = await assets.load(entry.model, { noCache: true });
    convertMaterials(gltf.scene);
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
  }));
  state.status = 'ready';
}

function addHouses(scene, state) {
  const preview = scene.id === INTRO;
  const offset = preview ? layout.introTransform : { scale: 1, x: 0, z: 0 };
  const group = new Group();
  group.name = preview ? 'Sultrarupa opening island houses' : 'Sultrarupa traditional houses';
  const targets = [];
  for (const site of layout.houses) {
    const source = state.templates.get(site.id);
    const content = HOUSE_EXHIBITS.find((entry) => entry.id === site.id);
    if (!source || !content) continue;
    const house = source.object.clone(true);
    const scale = (site.depth ?? 18) / source.size.z;
    house.scale.setScalar(scale * offset.scale);
    house.rotation.y = site.rotation || 0;
    house.position.set(site.x * offset.scale + offset.x, GROUND, site.z * offset.scale + offset.z);
    house.userData.exhibit = site.id;
    group.add(house);
    if (!preview) targets.push({
      ...content, kind: 'house',
      position: new Vector3(site.entrance?.x ?? site.x, GROUND + 2.1, site.entrance?.z ?? site.z),
    });
  }
  scene.base.add(group);
  group.updateMatrixWorld(true);
  state.houses = group;
  if (!preview) {
    state.guideTargets = [];
    for (const site of layout.guides) {
      const content = CULTURE_GUIDES.find((entry) => entry.id === site.id);
      if (!content) continue;
      const target = { ...content, kind: 'guide', position: new Vector3(site.x, GROUND + 3.3, site.z) };
      targets.push(target);
      state.guideTargets.push({ target, uid: guideUID(site.id) });
    }
    const lulo = CULTURE_GUIDES.find((entry) => entry.id === 'lulo');
    targets.push({ ...lulo, id: 'lulo-stage', title: 'Panggung Lulo', kind: 'guide',
      position: new Vector3(layout.stage.speakers.x, GROUND + 2.1, layout.stage.speakers.z + 3) });
    state.ui.setTargets(targets);
  }
}

function attachScene(scene, state) {
  state.ui.clear();
  state.houses?.removeFromParent();
  state.houses = null;
  state.guideTargets = [];
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
  };
  state.ui = createCultureUI({
    onOpenChange(open) {
      game.input?.keyboard?.unpressAllKeys();
      const scene = game.scenes?.current;
      if (scene?.id !== MAIN) return;
      scene.physics.movePlayer(new Vector3());
      scene.physics.togglePause(open);
    },
  });
  state.phoneMap = installSultraPhoneMap(game, { openTarget: (id) => state.ui.openTarget(id) });
  state.lulo = installSultraLulo(game, layout);
  function preload() {
    if (state.ready) return;
    configureScenes(game, state);
    state.ready = loadHouses(state).catch((error) => {
      state.status = 'error';
      state.error = error;
      console.error('[Sultrarupa island]', error);
    });
    game.app.$preloader.task(state.ready);
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
    if (!state.houses && state.status === 'ready') addHouses(scene, state);
    if (scene.id !== MAIN) return;
    for (const { target, uid } of state.guideTargets) {
      const actor = scene.actors[uid];
      if (actor?.base) target.position.copy(actor.base.position).add(GUIDE_OFFSET);
    }
    const camera = scene.getCurrentCamera()?.cam;
    if (camera && scene.player?.base) state.ui.update(camera, scene.player.base.position);
  });
  return state;
}
