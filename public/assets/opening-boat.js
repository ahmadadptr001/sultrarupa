import {
  cD as assets,
  cd as Group,
  a$ as MeshBasicMaterial,
  b0 as DoubleSide,
  bQ as SRGBColorSpace,
} from './vendor.75f6e6ae65453426.js';
import { assetUrl } from './asset-urls.js';

// The bundled glTF loader builds MeshStandardMaterial for pbrMetallicRoughness.
// This game's renderer only ever compiles ShaderMaterial and MeshBasicMaterial,
// so a MeshStandardMaterial fails to link ("useProgram: program not valid") and
// the mesh is silently dropped from the draw — which is what left the intro
// boat's replacement invisible. Rebuild every material as MeshBasicMaterial.
// The asset is shadeless anyway (emissive only, black baseColorFactor), so the
// unlit material is also the faithful one.
function toBasicMaterial(source) {
  const texture = source.emissiveMap || source.map || null;
  const material = new MeshBasicMaterial({
    color: 0xffffff,
    map: texture,
    vertexColors: Boolean(source.vertexColors),
    side: DoubleSide, // the glTF material is declared doubleSided
    transparent: Boolean(source.transparent),
    opacity: source.opacity ?? 1,
    alphaTest: source.alphaTest || 0,
    depthWrite: source.depthWrite !== false,
    fog: true, // matches the other meshes in the intro scene
    toneMapped: false,
  });
  if (texture) {
    texture.colorSpace = SRGBColorSpace;
    texture.flipY = false;
    texture.anisotropy = Math.max(texture.anisotropy || 1, 4);
    texture.needsUpdate = true;
  } else if (source.emissive && source.emissive.r + source.emissive.g + source.emissive.b > 0) {
    material.color.copy(source.emissive);
  } else if (source.color) {
    material.color.copy(source.color);
  }
  material.name = source.name;
  return material;
}

export function convertMaterials(root, { preserveBakedColors = false } = {}) {
  const stale = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    const source = object.material;
    if (Array.isArray(source)) {
      object.material = source.map((entry) => {
        stale.add(entry);
        return toBasicMaterial(entry);
      });
    } else if (source) {
      stale.add(source);
      object.material = toBasicMaterial(source);
    }
    if (preserveBakedColors) {
      // This legacy renderer outputs display-encoded colors directly. Decoding
      // a baked sRGB atlas without an output conversion makes pale fur dark.
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        material.fog = false;
        if (material.map) {
          material.map.encoding = 3000;
          material.map.needsUpdate = true;
        }
      }
    }
    object.castShadow = true;
    object.receiveShadow = true;
  });
  // dispose() releases the program/shaders but leaves textures alone, so the
  // maps we just handed to the new materials stay valid.
  stale.forEach((material) => material.dispose());
}

// Swap only the intro boat's appearance, retaining its animated parent and NPC.
export function installOpeningBoat(game) {
  if (game.openingBoat) return;
  const state = game.openingBoat = { status: 'loading', model: null, boat: null };
  const load = () => assets.load(assetUrl('/models/opening-boat.glb'), { noCache: true }).then((gltf) => {
    convertMaterials(gltf.scene, { preserveBakedColors: true });
    const model = new Group();
    model.name = 'Custom opening boat';
    model.add(gltf.scene);
    // Source length runs along Z; the original boat's bow runs along X.
    model.rotation.y = Math.PI / 2;
    // Everything below is measured against the live scene, not guessed. Sea
    // plane sits at world Y 0.229; the intro NPC's toe bones at Y 0.819. For
    // reference, the hull this replaces has its gunwale at 1.228 and its deck
    // at 0.75 — the feet stood only 0.07 above that deck, which is why the
    // original reads as standing on a shallow flat-bottomed boat.
    // Length is matched to the original hull: the asset is 1.898 long and the
    // boat it replaces is ~5.9 across.
    const length = 7 / 1.8975288868;
    // The source is a much shallower perahu than the one it replaces — at an
    // even scale its gunwale tops out at world Y 0.70, i.e. 0.11 *below* the
    // NPC's soles, which is why the feet perched on the rim instead of standing
    // in the hull. Stretch Y 1.36x to deepen it. The local Y axis is pure world
    // vertical here (the group is only rotated about Y), so the stretch adds
    // no shear; it just makes the hull deep enough to stand in.
    model.scale.set(length, length * 1.36, length);
    // Position is solved, not guessed. Raising the hull both lifts its floor
    // toward the NPC's soles and sinks its gunwale relative to them, but the
    // keel has to stay in the water, so the two constraints trade off:
    //   keel  0.195 — 0.034 under the waterline, so the hull floats
    //   floor 0.571 — 0.25 under the soles (the shallowest this hull allows)
    //   rim   1.228 — exactly the height of the gunwale it replaces
    // That leaves the feet 0.41 below the rim, the same relationship the
    // original boat had — but now inside the hull rather than on top of it.
    model.position.set(-0.2, 0.37, 0);
    state.model = model;
    state.status = 'ready';
  }).catch((error) => {
    state.status = 'error';
    console.error('[Opening boat]', error);
  });
  game.hooks.beforePreload.watch(() => {
    // The game binds savestate during init(), after this plugin is installed.
    if (game.savestate.getVariable('isIntroCompleted')) { state.status = 'skipped'; return; }
    game.app.$preloader.task(load());
  });
  game.hooks.beforeRender.watch(() => {
    const scene = game.scenes?.current;
    const boat = scene?.id === 'IslandIntro' ? scene.boat?.base : null;
    if (!state.model || boat === state.boat) return;
    state.model.removeFromParent();
    if (state.boat) {
      const hiddenMaterial = state.boat.material;
      state.boat.material = state.originalMaterial;
      hiddenMaterial.dispose();
    }
    state.boat = boat;
    if (!boat) return;
    state.originalMaterial = boat.material;
    boat.material = boat.material.clone();
    boat.material.visible = false;
    boat.add(state.model);
    state.model.updateMatrixWorld(true);
  });
}
