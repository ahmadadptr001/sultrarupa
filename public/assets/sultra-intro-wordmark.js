import {
  b6 as BufferAttribute,
  b7 as BufferGeometry,
} from './vendor.75f6e6ae65453426.js';

const WORDMARK_URL = '/models/sultra-rupa-wordmark.json';

async function loadWordmarkGeometry() {
  const response = await fetch(WORDMARK_URL);
  if (!response.ok) throw new Error(`Wordmark request failed: ${response.status}`);
  const { positions, indices } = await response.json();
  if (!Array.isArray(positions) || positions.length < 9 || positions.length % 3
    || !positions.every(Number.isFinite)) {
    throw new Error('Invalid Sultra Rupa wordmark positions');
  }
  const vertexCount = positions.length / 3;
  if (!Array.isArray(indices) || indices.length < 3 || indices.length % 3
    || !indices.every((index) => Number.isInteger(index) && index >= 0 && index < vertexCount)) {
    throw new Error('Invalid Sultra Rupa wordmark indices');
  }
  const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const geometry = new BufferGeometry();
  geometry.name = 'Sultra Rupa intro wordmark';
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(new BufferAttribute(new IndexArray(indices), 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// Replace the lettering inside the existing intro mesh. Its original material,
// responsive sizing, placement, camera movement and fade remain in control.
export function installSultraIntroWordmark(game) {
  if (game.sultraIntroWordmark) return;
  const state = game.sultraIntroWordmark = {
    status: 'loading', geometry: null, logo: null, fit: null, error: null,
  };
  const promise = loadWordmarkGeometry().then((geometry) => {
    state.geometry = geometry;
    state.status = 'ready';
  }).catch((error) => {
    state.status = 'error';
    state.error = error.message;
    // Keep the original mesh available if the replacement asset cannot load.
    console.error('[Sultra Rupa intro wordmark]', error);
  });
  game.hooks.beforePreload.watch(() => game.app.$preloader.task(promise));
  game.hooks.beforeRender.watch(() => {
    const scene = game.scenes?.current;
    const logo = scene?.id === 'IslandIntro' ? scene.logo : null;
    if (!logo?.base || !state.geometry) return;
    // The original camera can crop the title on narrow phones. Fit the artwork
    // within its existing anchor; keep the native mesh animation and transform.
    const ratio = window.innerWidth / window.innerHeight;
    const fit = 0.78 + 0.22 * Math.min(1, Math.max(0, (ratio - 0.5) / 0.4));
    if (logo === state.logo && fit === state.fit) return;
    // The intro's own cleanup disposes logo.geo. Give each intro instance its
    // own clone, retaining the loaded geometry for later visits to the intro.
    const geometry = state.geometry.clone();
    geometry.translate(0.0235, -0.7075, 0);
    geometry.scale(fit, fit, 1);
    geometry.translate(-0.0235, 0.7075, 0);
    if (logo === state.logo) logo.geo.dispose();
    logo.geo = geometry;
    logo.base.geometry = geometry;
    logo.base.visible = true;
    logo.base.name = 'Sultra Rupa intro wordmark';
    logo.base.userData.wordmark = 'SULTRA RUPA';
    state.logo = logo;
    state.fit = fit;
  });
}
