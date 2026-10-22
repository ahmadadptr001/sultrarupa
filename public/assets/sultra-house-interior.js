import {
  cD as assets,
  cM as Scene,
  ce as PerspectiveCamera,
  bG as WebGLRenderer,
  b0 as DoubleSide,
  aS as Vector3,
  cx as Box3,
} from './vendor.75f6e6ae65453426.js';
import { convertMaterials } from './opening-boat.js';
import { HOUSE_EXHIBITS } from './sultra-culture-data.js';
import { assetUrl } from './asset-urls.js';

const MODEL_URL = '/models/interiors/ruangan-kotak-besar.glb?v=traditional-room-20261021';
const EYE_HEIGHT = 1.65;
const WALK_SPEED = 2.2;
const RUN_SPEED = 3.6;
const LOOK_SENSITIVITY = 0.0032;
const TOUCH_LOOK_SENSITIVITY = 0.0046;
const ROOM_LIMIT = 6.85;
const PLAYER_RADIUS = 0.24;
const DOOR_REACH = 1.9;
const PITCH_LIMIT = 1.05;
const MIN_LOADING_TIME = 1800;
const LOADING_FADE_TIME = 600;
const SVG_NS = 'http://www.w3.org/2000/svg';
const MOVE_CODES = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.1');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (name === 'info') {
    const stem = document.createElementNS(SVG_NS, 'path');
    stem.setAttribute('d', 'M12 10.6v6.2');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', '12');
    dot.setAttribute('cy', '7.1');
    dot.setAttribute('r', '1.35');
    dot.setAttribute('fill', 'currentColor');
    dot.setAttribute('stroke', 'none');
    svg.append(stem, dot);
  } else {
    const cross = document.createElementNS(SVG_NS, 'path');
    cross.setAttribute('d', 'M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5');
    svg.append(cross);
  }
  return svg;
}

function installStyles() {
  if (document.querySelector('link[data-sultra-interior]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./sultra-interior.css', import.meta.url).href;
  link.dataset.sultraInterior = '';
  document.head.append(link);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createHouseInterior(game, { ui, onEnter, onExit, onInfo } = {}) {
  installStyles();

  const state = {
    open: false,
    destroyed: false,
    status: 'closed',
    target: null,
    model: null,
    modelPromise: null,
    doorPosition: null,
    obstacles: [],
    renderer: null,
    scene: null,
    camera: null,
    frame: 0,
    lastTime: 0,
    loadingStartedAt: 0,
    fadeTimer: 0,
    yaw: Math.PI,
    pitch: -0.03,
    position: new Vector3(0, EYE_HEIGHT, -6.1),
    keys: new Set(),
    stick: { id: null, x: 0, y: 0 },
    look: { id: null, x: 0, y: 0 },
    inert: new Map(),
    previousFocus: null,
    onEnter: onEnter || null,
    onExit: onExit || null,
    onInfo: onInfo || null,
  };

  const root = node('section', 'sc-interior');
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Interior rumah adat');

  if (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) {
    root.classList.add('is-touch');
  }

  const stage = node('div', 'sci-stage');
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Tampilan tiga dimensi interior rumah adat');
  const canvas = document.createElement('canvas');
  canvas.className = 'sci-canvas';
  stage.append(canvas);

  const vignette = node('div', 'sci-vignette');

  const top = node('div', 'sci-top');
  const heading = node('div', 'sci-heading');
  const kicker = node('span', 'sci-kicker', 'Interior rumah adat');
  const title = node('h2', 'sci-title', 'Rumah adat');
  const region = node('span', 'sci-region', 'Sulawesi Tenggara');
  heading.append(kicker, title, region);
  const infoButton = node('button', 'sci-info');
  infoButton.type = 'button';
  infoButton.setAttribute('aria-label', 'Info budaya');
  infoButton.title = 'Info budaya';
  infoButton.append(icon('info'));
  const closeButton = node('button', 'sci-close');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Tutup interior');
  closeButton.title = 'Tutup';
  closeButton.append(icon('close'));
  const actions = node('div', 'sci-actions');
  actions.append(infoButton, closeButton);
  top.append(heading, actions);

  const hint = node('div', 'sci-hint');
  hint.append(
    node('span', 'sci-desktop-only', 'Seret untuk melihat · WASD berjalan · Esc keluar'),
    node('span', 'sci-touch-only', 'Seret layar untuk melihat · joystick untuk berjalan'),
  );

  const stick = node('div', 'sci-stick');
  stick.setAttribute('aria-label', 'Joystick gerak');
  const knob = node('div', 'sci-knob');
  stick.append(knob);

  const doorButton = node('button', 'sci-door');
  doorButton.type = 'button';
  doorButton.hidden = true;
  doorButton.setAttribute('aria-label', 'Keluar rumah melalui pintu');
  doorButton.append(
    node('span', 'sci-desktop-only', 'E · Keluar rumah'),
    node('span', 'sci-touch-only', 'Keluar rumah'),
  );

  const loading = node('div', 'sci-loading');
  const loadingScene = node('div', 'sci-loader-scene');
  loadingScene.setAttribute('aria-hidden', 'true');
  loadingScene.innerHTML = `
    <svg viewBox="0 0 440 252" xmlns="http://www.w3.org/2000/svg">
      <g class="sci-l-sun">
        <circle cx="374" cy="45" r="20"/>
        <path d="M374 14v-8M374 84v-8M343 45h-8M413 45h-8M352 23l-6-6M402 73l-6-6M396 23l6-6M346 73l6-6"/>
      </g>
      <g class="sci-l-cloud sci-l-cloud-a">
        <path d="M50 70c0-9 7-16 16-16 4-11 14-18 26-18 14 0 25 9 28 21 10 0 18 7 18 16 0 9-7 16-17 16H66c-9 0-16-7-16-16z"/>
      </g>
      <g class="sci-l-cloud sci-l-cloud-b">
        <path d="M246 45c0-7 6-13 13-13 3-9 11-15 21-15 11 0 20 7 23 17 8 0 14 6 14 13 0 8-6 14-14 14h-43c-8 0-14-6-14-14z"/>
      </g>
      <path class="sci-l-hill sci-l-hill-back" d="M0 191c52-25 105-31 164-19 30 6 63 8 101 4 62-7 118-18 175-9v85H0z"/>
      <path class="sci-l-hill sci-l-hill-front" d="M0 213c64-13 126-17 188-12 42 4 78 10 119 9 49-1 94-9 133-17v59H0z"/>
      <path class="sci-l-path-edge" d="M-16 244c58-4 103-11 151-20 42-8 91-10 137-7 30 2 55 1 76-3"/>
      <path class="sci-l-path" d="M-16 244c58-4 103-11 151-20 42-8 91-10 137-7 30 2 55 1 76-3"/>
      <path class="sci-l-path-dash" d="M-8 244c58-4 101-11 147-20 42-8 91-10 137-7 29 2 53 1 74-3"/>
      <g class="sci-l-bush-b">
        <circle cx="264" cy="220" r="16"/>
        <circle cx="282" cy="224" r="13"/>
        <circle cx="249" cy="226" r="11"/>
      </g>
      <g class="sci-l-house">
        <rect class="sci-l-stilt" x="307" y="207" width="7" height="28" rx="3"/>
        <rect class="sci-l-stilt" x="390" y="207" width="7" height="28" rx="3"/>
        <rect class="sci-l-stilt" x="322" y="210" width="6" height="21" rx="3"/>
        <rect class="sci-l-stilt" x="376" y="210" width="6" height="21" rx="3"/>
        <rect class="sci-l-wall" x="300" y="133" width="104" height="77" rx="5"/>
        <path class="sci-l-roof" d="M286 140 351 82l66 58z"/>
        <path class="sci-l-roof-ridge" d="M300 136 351 95l52 41"/>
        <path class="sci-l-door" d="M337 210v-35c0-8 7-14 15-14s15 6 15 14v35z"/>
        <rect class="sci-l-window" x="312" y="151" width="17" height="18" rx="4"/>
        <rect class="sci-l-window" x="377" y="151" width="17" height="18" rx="4"/>
        <path class="sci-l-beam" d="M303 146h98M303 193h98"/>
        <path class="sci-l-step" d="M329 215h48M323 223h60"/>
        <circle class="sci-l-finial" cx="351" cy="82" r="5"/>
        <circle class="sci-l-finial" cx="286" cy="140" r="4"/>
        <circle class="sci-l-finial" cx="418" cy="140" r="4"/>
      </g>
      <g class="sci-l-walker">
        <g class="sci-l-bob">
          <path class="sci-l-tail" d="M84 221c-9-1-13-6-12-11"/>
          <path class="sci-l-leg sci-l-leg-a" d="M94 222l-1 18"/>
          <path class="sci-l-leg sci-l-leg-b" d="M108 222l2 18"/>
          <ellipse class="sci-l-body" cx="102" cy="205" rx="18" ry="21"/>
          <circle class="sci-l-head" cx="115" cy="179" r="14"/>
          <path class="sci-l-ear" d="M104 170c-6-5-10-3-10 2 0 4 5 6 9 4"/>
          <path class="sci-l-horns" d="M108 167c-5-9-11-13-17-12M121 166c3-9 8-14 14-14"/>
          <circle class="sci-l-nose" cx="128" cy="184" r="3"/>
          <circle class="sci-l-eye" cx="120" cy="176" r="2.6"/>
          <path class="sci-l-arm" d="M112 200c7 3 10 8 9 13"/>
          <path class="sci-l-sash" d="M85 204c11 7 24 8 34 1"/>
        </g>
      </g>
      <g class="sci-l-grass">
        <path d="M232 229l4-9M238 230l5-12M244 230l4-8M64 233l4-10M71 234l4-8M78 233l5-11"/>
      </g>
    </svg>`;
  const loadingKicker = node('span', 'sci-loading-kicker', 'Sebentar ya');
  const loadingTitle = node('h3', 'sci-loading-title', 'Memasuki rumah adat');
  const loadingText = node('p', 'sci-loading-text', 'Kami siapkan ruang dan cahayanya.');
  const progress = node('div', 'sci-progress');
  const progressBar = node('div', 'sci-progress-bar');
  const progressFill = node('div', 'sci-progress-fill');
  const progressValue = node('span', 'sci-progress-value', '0%');
  progressBar.append(progressFill);
  progress.append(progressBar, progressValue);
  const loadingCard = node('div', 'sci-loading-card');
  loadingCard.append(loadingKicker, loadingTitle, loadingText, progress);
  loading.append(loadingScene, loadingCard);
  loading.setAttribute('role', 'status');
  loading.setAttribute('aria-live', 'polite');

  const error = node('div', 'sci-error');
  error.hidden = true;
  const errorTitle = node('h3', 'sci-error-title', 'Interior belum bisa dimuat');
  const errorText = node('p', 'sci-error-text', 'Periksa koneksi lalu coba lagi, ya.');
  const retryButton = node('button', 'sci-retry', 'Coba lagi');
  retryButton.type = 'button';
  const errorCard = node('div', 'sci-error-card');
  errorCard.append(errorTitle, errorText, retryButton);
  error.append(errorCard);

  root.append(stage, vignette, top, hint, stick, doorButton, loading, error);
  document.body.append(root);

  function ensureRenderer() {
    if (state.renderer) return;
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0b0907, 1);
    state.renderer = renderer;
    state.scene = new Scene();
    state.camera = new PerspectiveCamera(62, 1, 0.05, 80);
    state.camera.rotation.order = 'YXZ';
  }

  function loadModel() {
    if (state.model) return Promise.resolve(state.model);
    if (state.modelPromise) return state.modelPromise;
    state.modelPromise = assets.load(assetUrl(MODEL_URL), { noCache: true, loader: 'gltf' }).then((gltf) => {
      const model = gltf.scene;
      convertMaterials(model);
      model.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          material.fog = false;
          material.side = DoubleSide;
          material.toneMapped = false;
          if (material.map) {
            material.map.encoding = 3000;
            material.map.anisotropy = Math.max(material.map.anisotropy || 1, 4);
            material.map.needsUpdate = true;
          }
          material.needsUpdate = true;
        }
      });
      model.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(model);
      const center = bounds.getCenter(new Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= bounds.min.y;
      model.updateMatrixWorld(true);
      state.model = model;
      return model;
    }).catch((problem) => {
      state.modelPromise = null;
      throw problem;
    });
    return state.modelPromise;
  }

  function setProgress(value) {
    const clamped = clamp(value, 0, 100);
    progressFill.style.width = `${clamped}%`;
    progressValue.textContent = `${Math.round(clamped)}%`;
  }

  function maybeReveal(now) {
    if (!state.open || state.status !== 'ready' || root.classList.contains('is-ready')) return;
    if (now - state.loadingStartedAt < MIN_LOADING_TIME) return;
    setProgress(100);
    root.classList.add('is-ready');
    clearTimeout(state.fadeTimer);
    state.fadeTimer = window.setTimeout(() => {
      if (state.open && root.classList.contains('is-ready')) loading.hidden = true;
    }, LOADING_FADE_TIME);
  }

  function updateLoading(now) {
    if (!state.open || state.status === 'error' || root.classList.contains('is-ready')) return;
    const ratio = clamp((now - state.loadingStartedAt) / MIN_LOADING_TIME, 0, 1);
    if (state.status === 'ready' && ratio >= 1) {
      maybeReveal(now);
      return;
    }
    setProgress(Math.min(94, ratio * 94));
  }

  function mountModel(model) {
    if (state.destroyed || !state.scene) return;
    if (model.parent !== state.scene) state.scene.add(model);
    configureRoom(model);
    error.hidden = true;
    state.status = 'ready';
    maybeReveal(performance.now());
  }

  function configureRoom(model) {
    state.obstacles = [];
    state.doorPosition = null;
    model.traverse((object) => {
      if (object.userData?.colliderOnly) object.visible = true;
      const houseIds = object.userData?.houseIds;
      if (Array.isArray(houseIds)) object.visible = houseIds.includes(state.target?.id);
    });
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      let ancestor = object;
      while (ancestor && ancestor !== model) {
        if (!ancestor.visible) return;
        ancestor = ancestor.parent;
      }
      if (object.name === 'InteriorDoor') {
        const bounds = new Box3().setFromObject(object);
        state.doorPosition = bounds.isEmpty()
          ? object.getWorldPosition(new Vector3())
          : bounds.getCenter(new Vector3());
      }
      if (object.userData?.interiorCollider || object.name.startsWith('Collider_')) {
        const bounds = new Box3().setFromObject(object);
        if (!bounds.isEmpty() && bounds.max.y > 0.14 && bounds.min.y < EYE_HEIGHT) {
          state.obstacles.push(bounds);
        }
      }
    });
    model.traverse((object) => {
      if (object.userData?.colliderOnly) object.visible = false;
    });
  }

  function canWalkTo(x, z) {
    return !state.obstacles.some((bounds) => (
      x > bounds.min.x - PLAYER_RADIUS && x < bounds.max.x + PLAYER_RADIUS
      && z > bounds.min.z - PLAYER_RADIUS && z < bounds.max.z + PLAYER_RADIUS
    ));
  }

  function updateDoorPrompt() {
    const door = state.doorPosition;
    if (!door || !root.classList.contains('is-ready')) {
      doorButton.hidden = true;
      return;
    }
    const dx = door.x - state.position.x;
    const dz = door.z - state.position.z;
    const distance = Math.hypot(dx, dz);
    const facing = -Math.sin(state.yaw) * dx - Math.cos(state.yaw) * dz;
    doorButton.hidden = distance > DOOR_REACH || facing < distance * 0.25;
  }

  function showError(problem) {
    console.error('[Sultrarupa interior]', problem);
    clearTimeout(state.fadeTimer);
    loading.hidden = true;
    error.hidden = false;
    root.classList.remove('is-ready');
    state.status = 'error';
  }

  function startLoad() {
    clearTimeout(state.fadeTimer);
    loading.hidden = false;
    error.hidden = true;
    root.classList.remove('is-ready');
    state.status = 'loading';
    state.loadingStartedAt = performance.now();
    setProgress(0);
    loadModel().then((model) => {
      if (!state.open) return;
      mountModel(model);
    }).catch((problem) => {
      if (!state.open) return;
      showError(problem);
    });
  }

  function resize() {
    if (!state.renderer || !state.camera) return;
    const width = Math.max(1, stage.clientWidth || window.innerWidth);
    const height = Math.max(1, stage.clientHeight || window.innerHeight);
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  }

  function resetView() {
    state.yaw = Math.PI;
    state.pitch = -0.03;
    state.position.set(0, EYE_HEIGHT, -6.1);
    state.keys.clear();
    state.look.id = null;
    state.stick.id = null;
    state.stick.x = 0;
    state.stick.y = 0;
    doorButton.hidden = true;
    knob.style.transform = 'translate(0px, 0px)';
    if (state.camera) {
      state.camera.position.copy(state.position);
      state.camera.rotation.set(state.pitch, state.yaw, 0);
    }
  }

  function updateCamera() {
    state.camera.position.copy(state.position);
    state.camera.rotation.set(state.pitch, state.yaw, 0);
  }

  function tick(now) {
    if (!state.open) return;
    const delta = state.lastTime ? Math.min((now - state.lastTime) / 1000, 0.05) : 0;
    state.lastTime = now;
    updateLoading(now);

    let forward = (state.keys.has('KeyW') || state.keys.has('ArrowUp') ? 1 : 0)
      - (state.keys.has('KeyS') || state.keys.has('ArrowDown') ? 1 : 0)
      - state.stick.y;
    let strafe = (state.keys.has('KeyD') || state.keys.has('ArrowRight') ? 1 : 0)
      - (state.keys.has('KeyA') || state.keys.has('ArrowLeft') ? 1 : 0)
      + state.stick.x;

    if (Math.abs(forward) < 0.08) forward = 0;
    if (Math.abs(strafe) < 0.08) strafe = 0;

    if (delta && root.classList.contains('is-ready') && (forward || strafe)) {
      const move = new Vector3(
        -Math.sin(state.yaw) * forward + Math.cos(state.yaw) * strafe,
        0,
        -Math.cos(state.yaw) * forward - Math.sin(state.yaw) * strafe,
      );
      if (move.lengthSq() > 0) {
        move.normalize();
        const speed = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight')
          ? RUN_SPEED : WALK_SPEED;
        const nextX = clamp(state.position.x + move.x * speed * delta, -ROOM_LIMIT, ROOM_LIMIT);
        if (canWalkTo(nextX, state.position.z)) state.position.x = nextX;
        const nextZ = clamp(state.position.z + move.z * speed * delta, -ROOM_LIMIT, ROOM_LIMIT);
        if (canWalkTo(state.position.x, nextZ)) state.position.z = nextZ;
      }
    }

    updateCamera();
    updateDoorPrompt();
    state.renderer.render(state.scene, state.camera);
    state.frame = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.lastTime = 0;
    updateCamera();
    state.frame = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.lastTime = 0;
  }

  function isolate(active) {
    if (active) {
      for (const element of document.body.children) {
        if (element === root || !(element instanceof HTMLElement)) continue;
        if (/^(SCRIPT|STYLE|LINK|META|TEMPLATE)$/.test(element.tagName)) continue;
        if (!state.inert.has(element)) {
          state.inert.set(element, {
            inert: element.inert,
            ariaHidden: element.getAttribute('aria-hidden'),
          });
        }
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
      }
      return;
    }
    for (const [element, previous] of state.inert) {
      element.inert = previous.inert;
      if (previous.ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', previous.ariaHidden);
    }
    state.inert.clear();
  }

  function show(target) {
    const exhibit = HOUSE_EXHIBITS.find((entry) => entry.id === target.id) || {};
    state.target = { ...exhibit, ...target };
    title.textContent = state.target.title || 'Rumah adat';
    region.textContent = state.target.region || 'Sulawesi Tenggara';
    loadingTitle.textContent = `Memasuki ${state.target.title || 'rumah adat'}`;
    state.previousFocus = document.activeElement;
    state.open = true;
    // The full-screen room has its own renderer. Suspend the hidden island's
    // simulation, skinning and draw calls until this room closes.
    state.outdoorWasStarted = Boolean(game.time?.isStarted);
    game.time?.stop();
    state.stopOutdoorWatch = game.store?.renderStopped?.watch((stopped) => {
      if (!stopped) state.outdoorWasStarted = true;
      game.time?.stop();
    });
    root.classList.remove('is-ready');
    loading.hidden = false;
    error.hidden = true;
    setProgress(0);
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sc-interior-open');
    isolate(true);
    resetView();
    resize();
    root.focus({ preventScroll: true });
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    startLoop();
  }

  function hide() {
    clearTimeout(state.fadeTimer);
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    root.classList.remove('is-ready');
    loading.hidden = true;
    doorButton.hidden = true;
    document.documentElement.classList.remove('sc-interior-open');
    stopLoop();
    if (state.stopOutdoorWatch) game.store.renderStopped.unwatch(state.stopOutdoorWatch);
    state.stopOutdoorWatch = null;
    if (state.outdoorWasStarted && !game.store?.renderStopped?.value) game.time?.start();
    state.open = false;
    state.keys.clear();
    state.look.id = null;
    state.stick.id = null;
    state.stick.x = 0;
    state.stick.y = 0;
    knob.style.transform = 'translate(0px, 0px)';
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    isolate(false);
  }

  function onVisibilityChange() {
    if (document.hidden) stopLoop();
    else if (state.open) startLoop();
  }

  function close({ reason = 'close', restoreFocus = true } = {}) {
    if (!state.open) return false;
    const target = state.target;
    hide();
    restoreFocusAfterClose(reason, restoreFocus);
    state.status = state.model ? 'ready' : 'closed';
    state.onExit?.(target, { reason });
    return true;
  }

  function restoreFocusAfterClose(reason, restoreFocus) {
    if (!restoreFocus || reason === 'info') return;
    const previous = state.previousFocus;
    state.previousFocus = null;
    if (previous instanceof HTMLElement && previous.isConnected && !previous.inert) {
      previous.focus({ preventScroll: true });
    }
  }

  function openCulture() {
    const id = state.target?.id;
    if (!id || !ui?.openTarget) return;
    state.onInfo?.(state.target);
    close({ reason: 'info', restoreFocus: false });
    ui.openTarget(id, { presentation: 'house-dialog' });
  }

  function open(target) {
    if (!target?.id) return false;
    if (state.destroyed) return false;
    if (state.open) return true;
    if (!HOUSE_EXHIBITS.some((entry) => entry.id === target.id)) return false;
    try {
      ensureRenderer();
    } catch (problem) {
      console.error('[Sultrarupa interior]', problem);
      return false;
    }
    show(target);
    startLoad();
    state.onEnter?.(state.target);
    return true;
  }

  function preload() {
    return loadModel();
  }

  function updateStick(event) {
    const rect = stick.getBoundingClientRect();
    const radius = rect.width * 0.38;
    let x = (event.clientX - (rect.left + rect.width / 2)) / radius;
    let y = (event.clientY - (rect.top + rect.height / 2)) / radius;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    state.stick.x = x;
    state.stick.y = y;
    knob.style.transform = `translate(${x * radius * 0.62}px, ${y * radius * 0.62}px)`;
  }

  function onKeyDown(event) {
    if (!state.open) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close({ reason: 'escape' });
      return;
    }
    if (event.code === 'KeyE' && !event.repeat && !doorButton.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close({ reason: 'door' });
      return;
    }
    const buttonFocused = event.target instanceof Element
      && event.target.closest('button, a, input, textarea, select, [contenteditable="true"]');
    if (event.code === 'Space') {
      if (buttonFocused) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (MOVE_CODES.has(event.code) || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.keys.add(event.code);
    }
  }

  function onKeyUp(event) {
    if (!state.open) return;
    if (MOVE_CODES.has(event.code) || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.keys.delete(event.code);
    }
  }

  function onStagePointerDown(event) {
    if (!state.open || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    state.look.id = event.pointerId;
    state.look.x = event.clientX;
    state.look.y = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  }

  function onStagePointerMove(event) {
    if (!state.open || state.look.id !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const sensitivity = event.pointerType === 'touch' ? TOUCH_LOOK_SENSITIVITY : LOOK_SENSITIVITY;
    state.yaw -= (event.clientX - state.look.x) * sensitivity;
    state.pitch -= (event.clientY - state.look.y) * sensitivity;
    state.pitch = clamp(state.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    state.look.x = event.clientX;
    state.look.y = event.clientY;
    updateCamera();
  }

  function endLook(event) {
    if (state.look.id !== event.pointerId) return;
    state.look.id = null;
    stage.classList.remove('is-dragging');
  }

  function onStickDown(event) {
    if (!state.open) return;
    event.preventDefault();
    event.stopPropagation();
    state.stick.id = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    updateStick(event);
  }

  function onStickMove(event) {
    if (!state.open || state.stick.id !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    updateStick(event);
  }

  function endStick(event) {
    if (state.stick.id !== event.pointerId) return;
    state.stick.id = null;
    state.stick.x = 0;
    state.stick.y = 0;
    knob.style.transform = 'translate(0px, 0px)';
  }

  function onContextMenu(event) {
    if (state.open) event.preventDefault();
  }

  closeButton.addEventListener('click', () => close({ reason: 'button' }));
  doorButton.addEventListener('click', () => close({ reason: 'door' }));
  infoButton.addEventListener('click', openCulture);
  retryButton.addEventListener('click', startLoad);
  stage.addEventListener('pointerdown', onStagePointerDown);
  stage.addEventListener('pointermove', onStagePointerMove);
  stage.addEventListener('pointerup', endLook);
  stage.addEventListener('pointercancel', endLook);
  stage.addEventListener('lostpointercapture', endLook);
  stage.addEventListener('contextmenu', onContextMenu);
  stick.addEventListener('pointerdown', onStickDown);
  stick.addEventListener('pointermove', onStickMove);
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);
  stick.addEventListener('lostpointercapture', endStick);

  const isOpen = () => state.open;

  return {
    preload,
    open,
    close,
    get isOpen() { return isOpen(); },
    get status() { return state.status; },
    get target() { return state.target; },
    destroy() {
      close({ reason: 'destroy', restoreFocus: false });
      state.destroyed = true;
      stopLoop();
      state.renderer?.dispose();
      state.renderer = null;
      root.remove();
    },
  };
}
