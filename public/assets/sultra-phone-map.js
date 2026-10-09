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
.phone-tab.map.sultra-phone-map-active > :not(.sultra-phone-map) { display: none !important; }
.sultra-phone-map { position: absolute; inset: 0; display: flex; flex-direction: column; box-sizing: border-box; padding: calc(98px * var(--phone-scale, 1)) 5% calc(18px * var(--phone-scale, 1)); overflow: auto; overscroll-behavior: contain; background: #d7edf0; color: #214e50; font: 14px/1.4 Arial, sans-serif; cursor: default; }
.sultra-phone-map * { box-sizing: border-box; }
.sultra-phone-map header { flex: 0 0 auto; padding: 0 5px; }
.sultra-phone-map h2 { margin: 0; font-size: clamp(15px, 3vh, 23px); font-weight: 700; color: #214e50; letter-spacing: -.025em; }
.sultra-phone-map header p { margin: 3px 0 0; color: #60858a; font-size: 10px; }
.spm-map-frame { position: relative; flex: 1 0 220px; min-height: 220px; container-type: size; margin: 4px 0; }
.spm-chart { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(100cqw, calc(100cqh * 360 / 370)); height: min(100cqh, calc(100cqw * 370 / 360)); }
.spm-chart > svg { display: block; width: 100%; height: 100%; }
.spm-chart button { position: absolute; display: grid; place-items: center; padding: 0; transform: translate(-50%, -50%); border: 2px solid #fffaf0; border-radius: 50%; background: #2e694d; color: #fffaf0; width: 29px; height: 29px; box-shadow: 0 2px 5px #123c3c3b; cursor: pointer; }
.spm-chart button::before { content: ''; position: absolute; inset: -6px; border-radius: 50%; }
.spm-chart button:hover, .spm-chart button:focus-visible { background: #bf8150; z-index: 5; }
.spm-chart button:focus-visible, .spm-directory button:focus-visible { outline: 3px solid #2b8294; outline-offset: 3px; }
.spm-chart button svg { width: 16px; height: 16px; }
.spm-chart .spm-guide { width: 11px; height: 11px; background: #c58e53; border-width: 1.5px; box-shadow: 0 1px 2px #123c3c3b; z-index: 1; }
.spm-chart .spm-stage { width: 27px; height: 27px; background: #a65d44; z-index: 2; }
.spm-player { position: absolute; pointer-events: none; width: 11px; height: 11px; background: #126ac7; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 4px #126ac73b; transform: translate(-50%, -50%); z-index: 4; }
.spm-player[hidden] { display: none; }
.spm-legend { display: flex; justify-content: center; flex-wrap: wrap; gap: 7px 13px; margin: 3px 0 12px; font-size: 9px; color: #4d7678; }
.spm-legend span { display: inline-flex; align-items: center; gap: 5px; }
.spm-legend span::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #2e694d; }
.spm-legend .spm-guide-key::before { background: #c58e53; }
.spm-legend .spm-player-key::before { background: #126ac7; }
.spm-directory { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex: 0 0 auto; }
.spm-directory button { display: flex; align-items: center; gap: 7px; min-height: 35px; padding: 7px 9px; text-align: left; border: 1px solid #bad6cd; border-radius: 8px; color: #2b5545; background: #f7fbef; font: inherit; font-size: 10px; cursor: pointer; }
.spm-directory button:hover { background: #e7f0d6; }
.spm-directory button svg { width: 16px; height: 16px; flex: 0 0 auto; }
.spm-directory .spm-stage-entry { grid-column: 1 / -1; background: #f9edda; border-color: #e3caaa; color: #8b5539; }
.spm-note { margin: 9px 3px 0; color: #668888; font-size: 8px; line-height: 1.5; }
@media (max-height: 720px) and (min-width: 701px) { .spm-map-frame { min-height: 165px; flex-basis: 165px; } .spm-directory { gap: 4px; } .spm-directory button { min-height: 29px; padding: 5px 7px; } }
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
  svg.append(svgNode('path', { d: kind === 'stage' ? 'M9 18V5l11-2v13M9 5v4l11-2M9 18c0 2-6 4-6 1s6-4 6-1m11-2c0 2-6 4-6 1s6-4 6-1' : 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8' }));
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

/** Replaces only the native phone's map pane, keeping its navigation and back button. */
export function installSultraPhoneMap(game, { openTarget = (id) => game.sultraIsland?.ui?.openTarget(id) } = {}) {
  if (game.sultraPhoneMap) return game.sultraPhoneMap;
  const style = node('style');
  style.dataset.sultraPhoneMap = '';
  style.textContent = STYLES;
  document.head.append(style);
  const views = new Set();
  let destroyed = false;

  function makeButton(id, title, className, kind) {
    const button = node('button', className);
    button.type = 'button';
    button.dataset.cultureId = id;
    button.title = title;
    button.setAttribute('aria-label', `Buka cerita ${title}`);
    if (kind) button.append(symbol(kind));
    button.addEventListener('click', () => openTarget(id));
    return button;
  }

  function attach(tab) {
    if (tab.querySelector('.sultra-phone-map')) return;
    const root = node('section', 'sultra-phone-map');
    root.lang = 'id';
    root.setAttribute('aria-label', 'Peta pulau Sultrarupa');
    const heading = node('header');
    heading.append(node('h2', '', 'Pulau Sultrarupa'), node('p', '', 'Jelajah budaya Sulawesi Tenggara'));
    const mapFrame = node('div', 'spm-map-frame');
    const chart = node('div', 'spm-chart');
    const svg = svgNode('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, preserveAspectRatio: 'none', 'aria-hidden': true });
    const coast = path(layout.outline, true);
    svg.append(
      svgNode('path', { d: coast, fill: 'none', stroke: '#bcdee0', 'stroke-width': 20, 'stroke-linejoin': 'round' }),
      svgNode('path', { d: coast, fill: 'none', stroke: '#edf2d3', 'stroke-width': 8, 'stroke-linejoin': 'round' }),
      svgNode('path', { d: coast, fill: '#8cc684', stroke: '#72ac73', 'stroke-width': .75 }),
    );
    for (const road of layout.paths || []) svg.append(svgNode('path', { d: path(road), fill: 'none', stroke: '#f3e8b5', 'stroke-width': 2.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    const compass = svgNode('g', { transform: 'translate(26 31)', fill: '#608b8b' });
    const north = svgNode('text', { x: 0, y: -11, 'text-anchor': 'middle', 'font-size': 9, 'font-family': 'Arial' });
    north.textContent = 'U';
    compass.append(north, svgNode('path', { d: 'M0 -6 L4 7 L0 4 L-4 7 Z' }));
    svg.append(compass);
    chart.append(svg);
    const directory = node('nav', 'spm-directory');
    directory.setAttribute('aria-label', 'Tujuan budaya di pulau');
    for (const site of layout.houses) {
      const content = HOUSE_EXHIBITS.find((entry) => entry.id === site.id);
      if (!content) continue;
      const pin = makeButton(site.id, content.title, 'spm-house', 'house');
      position(pin, site.x, site.z);
      chart.append(pin);
      const entry = makeButton(site.id, content.title, '', 'house');
      entry.append(node('span', '', content.title.replace(/^Rumah Adat /i, '')));
      directory.append(entry);
    }
    const guidePins = [];
    for (const site of layout.guides) {
      const content = CULTURE_GUIDES.find((entry) => entry.id === site.id);
      const pin = makeButton(site.id, content?.title || site.id, 'spm-guide');
      position(pin, site.x, site.z);
      chart.append(pin);
      guidePins.push({ site, pin });
    }
    const stage = layout.stage || layout.luloStage || layout.guides.find((entry) => entry.id === 'lulo');
    if (stage) {
      const pin = makeButton('lulo-stage', 'Panggung Lulo', 'spm-stage', 'stage');
      position(pin, stage.x, stage.z);
      chart.append(pin);
      const entry = makeButton('lulo-stage', 'Panggung Lulo', 'spm-stage-entry', 'stage');
      entry.append(node('span', '', 'Panggung Lulo · musik & tari bersama'));
      directory.append(entry);
    }
    const player = node('span', 'spm-player');
    player.title = 'Posisimu';
    player.setAttribute('aria-label', 'Posisimu di pulau');
    chart.append(player);
    const legend = node('div', 'spm-legend');
    legend.append(node('span', '', 'Rumah adat'), node('span', 'spm-guide-key', 'Pemandu'), node('span', 'spm-player-key', 'Posisimu'));
    mapFrame.append(chart);
    root.append(heading, mapFrame, legend, directory, node('p', 'spm-note', 'Ketuk tujuan untuk membaca cerita. Penempatan budaya mengikuti area pameran pulau.'));
    // The original map has drag handlers on its ancestors; don't let a pin drag it.
    for (const eventName of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'wheel']) root.addEventListener(eventName, (event) => event.stopPropagation());
    tab.classList.add('sultra-phone-map-active');
    tab.append(root);
    views.add({ tab, root, player, guidePins });
  }

  function update() {
    document.documentElement.classList.toggle('sultra-phone-open', Boolean(game.store?.onPhone ?? document.querySelector('.phone-tab')));
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
