import layout from './sultra-island-layout.js';
import { HOUSE_EXHIBITS, CULTURE_GUIDES } from './sultra-culture-data.js';

const NS = 'http://www.w3.org/2000/svg';
const WIDTH = 360;
const HEIGHT = 370;
const PAD = 28;
const [[MIN_X, , MIN_Z], [MAX_X, , MAX_Z]] = layout.bounds;
const SCALE = Math.min((WIDTH - PAD * 2) / (MAX_X - MIN_X), (HEIGHT - PAD * 2) / (MAX_Z - MIN_Z));
const OFFSET_X = (WIDTH - (MAX_X - MIN_X) * SCALE) / 2;
const OFFSET_Z = (HEIGHT - (MAX_Z - MIN_Z) * SCALE) / 2;

const STYLES = `
.phone-tab.map.sultra-phone-map-active > .content:not(.sultra-phone-map) { display: none !important; }
.phone-tab.map.sultra-phone-map-active > .map-container { display: none !important; }
.sultra-phone-map { position: absolute; inset: 0; z-index: 1; box-sizing: border-box; padding: 0 !important; overflow: hidden; color: #3b3777; font-family: Gilmer, "Avenir Next", sans-serif; }
.sultra-phone-map * { box-sizing: border-box; }
.spm-map-container { position: absolute; inset: 0; overflow: hidden; background: #4c9fd8; cursor: var(--cursor-grab, grab); touch-action: pan-x pan-y; }
.spm-map-container:active { cursor: var(--cursor-grabbing, grabbing); }
.spm-chart { position: absolute; top: 52%; left: 50%; width: calc(430px * var(--phone-scale, 1)); height: calc(442px * var(--phone-scale, 1)); transform: translate(-50%, -50%); }
.spm-chart > svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 calc(12px * var(--phone-scale, 1)) calc(8px * var(--phone-scale, 1)) rgb(29 85 130 / 28%)); }
.spm-land-shadow { fill: #367bb7; opacity: .35; transform: translate(0 6px); }
.spm-coast { fill: #f4ebbf; stroke: #fff; stroke-width: 10; stroke-linejoin: round; }
.spm-land { fill: #9ddd7b; stroke: #72bf6c; stroke-width: 2; stroke-linejoin: round; }
.spm-trail { fill: none; stroke: #f7eabc; stroke-width: 3.1; stroke-linecap: round; stroke-linejoin: round; }
.spm-compass { fill: #fff; opacity: .94; }
.spm-map-title { fill: #fff; font-family: Comfortaa, Gilmer, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .04em; text-anchor: middle; }
.spm-pin { position: absolute; display: flex; align-items: flex-start; justify-content: center; width: calc(60px * var(--phone-scale, 1)); height: calc(75px * var(--phone-scale, 1)); padding: 0; border: 0; background: transparent; color: #3b3777; cursor: var(--cursor-pointer, pointer); transform: translate(calc(-50% + var(--pin-offset-x, 0px)), calc(-100% + var(--pin-offset-y, 0px))) scale(.9); transform-origin: bottom center; transition: transform .5s cubic-bezier(.23, 1, .32, 1); }
.spm-pin::after { position: absolute; top: calc(48px * var(--phone-scale, 1)); left: calc(21px * var(--phone-scale, 1)); z-index: 0; width: calc(18px * var(--phone-scale, 1)); height: calc(25px * var(--phone-scale, 1)); content: ''; background: rgb(59 55 119 / 40%); clip-path: polygon(0 0, 100% 0, 50% 100%); }
.spm-pin:hover, .spm-pin:focus-visible, .spm-pin:active { z-index: 5; transform: translate(calc(-50% + var(--pin-offset-x, 0px)), calc(-100% + var(--pin-offset-y, 0px))) scale(1); }
.spm-pin:active { cursor: var(--cursor-pointerActive, pointer); }
.spm-pin:focus-visible { outline: 0; }
.spm-pin-circle { position: relative; z-index: 1; display: grid; place-items: center; width: calc(52px * var(--phone-scale, 1)); height: calc(52px * var(--phone-scale, 1)); overflow: hidden; background: #fff; border: calc(4px * var(--phone-scale, 1)) solid rgb(59 55 119 / 40%); border-radius: 50%; box-shadow: 0 calc(2px * var(--phone-scale, 1)) calc(5px * var(--phone-scale, 1)) rgb(0 0 0 / 15%); transition: border-color .3s cubic-bezier(.23, 1, .32, 1); }
.spm-pin:hover .spm-pin-circle, .spm-pin:focus-visible .spm-pin-circle { border-color: #f2ba00aa; }
.spm-pin svg { width: calc(26px * var(--phone-scale, 1)); height: calc(26px * var(--phone-scale, 1)); }
.spm-guide .spm-pin-circle { border-color: #f2ba00; color: #d58b37; }
.spm-stage .spm-pin-circle { border-color: #f2676f; color: #e26470; }
.spm-player { position: absolute; z-index: 6; width: calc(40px * var(--phone-scale, 1)); height: calc(40px * var(--phone-scale, 1)); pointer-events: none; transform: translate(-50%, -50%); }
.spm-player::before { position: absolute; inset: 0; content: ''; background: #fff; border-radius: 50%; animation: spm-pulse 2s infinite; }
.spm-player::after { position: absolute; inset: calc(8px * var(--phone-scale, 1)); content: ''; background: #fff; border: calc(8px * var(--phone-scale, 1)) solid #3ddcff; border-radius: 50%; }
.spm-player[hidden] { display: none; }
.spm-confirm[hidden] { display: none; }
.spm-confirm { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: calc(30px * var(--phone-scale, 1)); }
.spm-confirm-backdrop { position: absolute; inset: 0; background: rgb(22 34 88 / 34%); backdrop-filter: blur(calc(2px * var(--phone-scale, 1))); }
.spm-confirm-card { position: relative; width: min(calc(302px * var(--phone-scale, 1)), 100%); padding: calc(22px * var(--phone-scale, 1)); overflow: hidden; border: calc(2px * var(--phone-scale, 1)) solid rgb(255 255 255 / 75%); border-radius: calc(25px * var(--phone-scale, 1)); background: linear-gradient(145deg, #ffffff 0%, #f0efff 100%); box-shadow: 0 calc(14px * var(--phone-scale, 1)) calc(30px * var(--phone-scale, 1)) rgb(25 35 94 / 28%); color: #3b3777; text-align: center; }
.spm-confirm-icon { display: grid; place-items: center; width: calc(58px * var(--phone-scale, 1)); height: calc(58px * var(--phone-scale, 1)); margin: 0 auto calc(12px * var(--phone-scale, 1)); border: calc(4px * var(--phone-scale, 1)) solid #d9dff4; border-radius: 50%; background: #fff; color: #5f5a98; }
.spm-confirm-icon svg { width: calc(29px * var(--phone-scale, 1)); height: calc(29px * var(--phone-scale, 1)); }
.spm-confirm-card h2 { margin: 0 0 calc(7px * var(--phone-scale, 1)); font: 700 calc(17px * var(--phone-scale, 1))/1.2 Comfortaa, Gilmer, sans-serif; color: #3b3777; }
.spm-confirm-card p { margin: 0; color: #5d598d; font-size: calc(11px * var(--phone-scale, 1)); line-height: 1.45; }
.spm-confirm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: calc(8px * var(--phone-scale, 1)); margin-top: calc(17px * var(--phone-scale, 1)); }
.spm-confirm-actions button { min-height: calc(34px * var(--phone-scale, 1)); padding: calc(7px * var(--phone-scale, 1)) calc(9px * var(--phone-scale, 1)); border: 0; border-radius: calc(17px * var(--phone-scale, 1)); font: 700 calc(10px * var(--phone-scale, 1))/1 Gilmer, sans-serif; cursor: var(--cursor-pointer, pointer); transition: transform .2s ease, background .2s ease; }
.spm-confirm-actions button:hover { transform: translateY(calc(-1px * var(--phone-scale, 1))); }
.spm-confirm-cancel { background: rgb(59 55 119 / 10%); color: #49447e; }
.spm-confirm-go { background: #4a9bd4; color: #fff; box-shadow: 0 calc(3px * var(--phone-scale, 1)) 0 #2877ad; }
.spm-confirm-go:active { transform: translateY(calc(2px * var(--phone-scale, 1))); box-shadow: 0 calc(1px * var(--phone-scale, 1)) 0 #2877ad; }
@keyframes spm-pulse { 0%, 70% { opacity: .7; transform: scale(.9); } 100% { opacity: 0; transform: scale(2); } }
`;

function node(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = text;
  return result;
}

function svgNode(tag, attributes) {
  const result = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => result.setAttribute(key, String(value)));
  return result;
}

function symbol(kind) {
  const svg = svgNode('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': true });
  const paths = {
    house: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
    guide: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21v-3a7 7 0 0 1 14 0v3M12 13v5M10 16h4',
    stage: 'M9 18V5l11-2v13M9 5v4l11-2M9 18c0 2-6 4-6 1s6-4 6-1m11-2c0 2-6 4-6 1s6-4 6-1',
  };
  svg.append(svgNode('path', { d: paths[kind] || paths.house }));
  return svg;
}

function point(x, z) {
  return [OFFSET_X + (x - MIN_X) * SCALE, OFFSET_Z + (z - MIN_Z) * SCALE];
}

function path(points, close = false) {
  return points.map(([x, z], index) => `${index ? 'L' : 'M'}${point(x, z).map((value) => value.toFixed(2)).join(' ')}`).join(' ') + (close ? ' Z' : '');
}

function position(element, x, z) {
  const [px, py] = point(x, z);
  element.style.left = `${px / WIDTH * 100}%`;
  element.style.top = `${py / HEIGHT * 100}%`;
  return px >= 0 && px <= WIDTH && py >= 0 && py <= HEIGHT;
}

const PIN_SLOTS = {
  alionda: [185, 80], 'banua-tada': [255, 160], 'bharugano-wuna': [185, 320],
  'kaghati-kolope': [255, 240], laika: [185, 240], lulo: [185, 160],
  'lulo-stage': [45, 160], lumense: [115, 160], mekongga: [115, 320],
  pomani: [255, 320], 'tenun-konawe': [115, 240],
};

function placePin(element, id, x, z) {
  position(element, x, z);
  const [px, py] = point(x, z);
  const [slotX, slotY] = PIN_SLOTS[id] || [px, py];
  const offsetX = slotX - px;
  const offsetY = slotY - py;
  element.style.setProperty('--pin-offset-x', `calc(${offsetX}px * var(--phone-scale, 1))`);
  element.style.setProperty('--pin-offset-y', `calc(${offsetY}px * var(--phone-scale, 1))`);
}

/** Replaces only the native phone's map pane, keeping its navigation and back button. */
export function installSultraPhoneMap(game, { navigateTo = () => false } = {}) {
  if (game.sultraPhoneMap) return game.sultraPhoneMap;
  const style = node('style');
  style.dataset.sultraPhoneMap = '';
  style.textContent = STYLES;
  document.head.append(style);
  const views = new Set();
  let destroyed = false;

  function makeButton(id, title, className, kind, onSelect) {
    const button = node('button', `spm-pin ${className}`);
    button.type = 'button';
    button.dataset.cultureId = id;
    button.title = title;
    button.setAttribute('aria-label', `Pilih lokasi ${title}`);
    const circle = node('span', 'spm-pin-circle');
    if (kind) circle.append(symbol(kind));
    button.append(circle);
    button.addEventListener('click', () => onSelect(id, title, button));
    return button;
  }

  function attach(tab) {
    if (tab.querySelector('.sultra-phone-map')) return;
    const root = node('section', 'content fullscreen map sultra-phone-map');
    root.lang = 'id';
    root.setAttribute('aria-label', 'Peta pulau Sultrarupa');
    const confirmation = node('section', 'spm-confirm');
    confirmation.hidden = true;
    confirmation.setAttribute('role', 'dialog');
    confirmation.setAttribute('aria-modal', 'true');
    confirmation.setAttribute('aria-labelledby', 'spm-confirm-title');
    const confirmBackdrop = node('div', 'spm-confirm-backdrop');
    const confirmCard = node('article', 'spm-confirm-card');
    const confirmIcon = node('span', 'spm-confirm-icon');
    confirmIcon.append(symbol('guide'));
    const confirmTitle = node('h2', '', 'Pergi ke lokasi ini?');
    confirmTitle.id = 'spm-confirm-title';
    const confirmCopy = node('p', '', 'Kamu akan diarahkan ke lokasi pilihanmu di pulau.');
    const confirmActions = node('div', 'spm-confirm-actions');
    const cancel = node('button', 'spm-confirm-cancel', 'Batal');
    cancel.type = 'button';
    const go = node('button', 'spm-confirm-go', 'Arahkan saya');
    go.type = 'button';
    confirmActions.append(cancel, go);
    confirmCard.append(confirmIcon, confirmTitle, confirmCopy, confirmActions);
    confirmation.append(confirmBackdrop, confirmCard);
    let pendingDestination = null;
    let returnFocus = null;
    const closeConfirmation = () => {
      confirmation.hidden = true;
      pendingDestination = null;
      returnFocus?.focus?.({ preventScroll: true });
      returnFocus = null;
    };
    const requestNavigation = (id, title, button) => {
      pendingDestination = { id, title };
      returnFocus = button;
      confirmTitle.textContent = `Pergi ke ${title}?`;
      confirmCopy.textContent = 'Kamu akan diarahkan ke lokasi pilihanmu di pulau.';
      confirmation.hidden = false;
      requestAnimationFrame(() => go.focus({ preventScroll: true }));
    };
    cancel.addEventListener('click', closeConfirmation);
    confirmBackdrop.addEventListener('click', closeConfirmation);
    go.addEventListener('click', () => {
      const destination = pendingDestination;
      if (!destination) return;
      confirmation.hidden = true;
      pendingDestination = null;
      returnFocus = null;
      navigateTo(destination.id);
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !confirmation.hidden) {
        event.preventDefault();
        closeConfirmation();
      }
    });
    const mapFrame = node('div', 'spm-map-container');
    const chart = node('div', 'spm-chart');
    const svg = svgNode('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, preserveAspectRatio: 'none', 'aria-hidden': true });
    const coast = path(layout.outline, true);
    svg.append(
      svgNode('path', { d: coast, class: 'spm-land-shadow' }),
      svgNode('path', { d: coast, class: 'spm-coast' }),
      svgNode('path', { d: coast, class: 'spm-land' }),
    );
    for (const road of layout.paths || []) svg.append(svgNode('path', { d: path(road), class: 'spm-trail' }));
    const compass = svgNode('g', { transform: 'translate(36 44)', class: 'spm-compass' });
    const north = svgNode('text', { x: 0, y: -12, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'Gilmer', 'font-weight': 700 });
    north.textContent = 'U';
    compass.append(north, svgNode('path', { d: 'M0 -6 L5 9 L0 5 L-5 9 Z' }));
    svg.append(compass);
    chart.append(svg);
    for (const site of layout.houses) {
      const content = HOUSE_EXHIBITS.find((entry) => entry.id === site.id);
      if (!content) continue;
      const pin = makeButton(site.id, content.title, 'spm-house', 'house', requestNavigation);
      placePin(pin, site.id, site.x, site.z);
      chart.append(pin);
    }
    const guidePins = [];
    for (const site of layout.guides) {
      const content = CULTURE_GUIDES.find((entry) => entry.id === site.id);
      const pin = makeButton(site.id, content?.title || site.id, 'spm-guide', 'guide', requestNavigation);
      placePin(pin, site.id, site.x, site.z);
      chart.append(pin);
      guidePins.push({ site, pin });
    }
    const stage = layout.stage || layout.luloStage || layout.guides.find((entry) => entry.id === 'lulo');
    if (stage) {
      const pin = makeButton('lulo-stage', 'Panggung Lulo', 'spm-stage', 'stage', requestNavigation);
      placePin(pin, 'lulo-stage', stage.x, stage.z);
      chart.append(pin);
    }
    const player = node('span', 'spm-player');
    player.title = 'Posisimu';
    player.setAttribute('aria-label', 'Posisimu di pulau');
    chart.append(player);
    mapFrame.append(chart);
    root.append(mapFrame, confirmation);
    // The original map has drag handlers on its ancestors; don't let a pin drag it.
    for (const eventName of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'wheel']) root.addEventListener(eventName, (event) => event.stopPropagation());
    tab.classList.add('sultra-phone-map-active');
    tab.append(root);
    views.add({ tab, root, player, guidePins });
  }

  function update() {
    const phoneOpen = game.store?.onPhone?.value ?? game.store?.onPhone ?? Boolean(document.querySelector('.phone-tab'));
    document.documentElement.classList.toggle('sultra-phone-open', Boolean(phoneOpen));
    const scene = game.scenes?.current;
    for (const view of views) {
      if (!view.root.isConnected) { views.delete(view); continue; }
      const current = scene?.player?.base?.position || game.store?.playerPosition;
      view.player.hidden = !current || scene?.id !== 'IslandWest';
      if (!view.player.hidden) view.player.hidden = !position(view.player, current.x, current.z);
      for (const { site, pin } of view.guidePins) {
        const current = scene?.actors?.[`NPC_SultraGuide_${site.id}`]?.base?.position;
        position(pin, current?.x ?? site.x, current?.z ?? site.z);
      }
    }
  }

  function scan() {
    if (destroyed) return;
    document.querySelectorAll('.phone-tab.map').forEach(attach);
    update();
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  const interval = window.setInterval(update, 300);
  scan();
  const state = game.sultraPhoneMap = {
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      window.clearInterval(interval);
      for (const view of views) { view.root.remove(); view.tab.classList.remove('sultra-phone-map-active'); }
      views.clear();
      style.remove();
      document.documentElement.classList.remove('sultra-phone-open');
      delete game.sultraPhoneMap;
    },
  };
  return state;
}
