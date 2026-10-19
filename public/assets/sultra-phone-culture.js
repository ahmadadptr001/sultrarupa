import { HOUSE_EXHIBITS, CULTURE_GUIDES } from './sultra-culture-data.js';
import layout from './sultra-island-layout.js';

const STYLES = `
.phone-tab.fintechs.sultra-phone-culture-active > .content:not(.sultra-phone-culture) { display: none !important; }
.sultra-phone-culture { position: absolute !important; inset: 0 !important; z-index: 1; display: block !important; width: 100% !important; height: var(--phone-height) !important; min-height: 0 !important; max-height: var(--phone-height) !important; box-sizing: border-box; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; padding: calc(100px * var(--phone-scale, 1)) calc(28px * var(--phone-scale, 1)) calc(28px * var(--phone-scale, 1)) !important; color: #3b3777; background: transparent !important; font: 500 calc(13px * var(--phone-scale, 1))/1.25 Gilmer, "Avenir Next", sans-serif; cursor: default; scrollbar-width: thin; scrollbar-color: #9e9bbe66 transparent; touch-action: pan-y; }
.sultra-phone-culture * { box-sizing: border-box; }
.spc-heading { margin: 0 0 calc(20px * var(--phone-scale, 1)); text-align: center; }
.spc-kicker { margin: 0 0 calc(5px * var(--phone-scale, 1)); color: #706ca6; font-size: calc(8px * var(--phone-scale, 1)); font-weight: 700; letter-spacing: .13em; }
.sultra-phone-culture h2 { margin: 0 0 calc(5px * var(--phone-scale, 1)); font: 700 calc(22px * var(--phone-scale, 1))/1.15 Comfortaa, Gilmer, sans-serif; letter-spacing: 0; color: #3b3777; text-shadow: 0 1px 0 rgb(255 255 255 / 25%); }
.spc-heading > p:last-of-type { max-width: calc(320px * var(--phone-scale, 1)); margin: 0 auto; color: #3b3777; font-size: calc(13px * var(--phone-scale, 1)); line-height: 1.2; }
.sultra-phone-culture button { font: inherit; cursor: var(--cursor-pointer, pointer); color: inherit; -webkit-tap-highlight-color: transparent; }
.sultra-phone-culture button:focus-visible { outline: calc(3px * var(--phone-scale, 1)) solid #3b3777; outline-offset: calc(3px * var(--phone-scale, 1)); }
.spc-map-button { display: inline-flex; align-items: center; justify-content: center; gap: calc(7px * var(--phone-scale, 1)); min-height: calc(31px * var(--phone-scale, 1)); padding: calc(6px * var(--phone-scale, 1)) calc(13px * var(--phone-scale, 1)); margin-top: calc(12px * var(--phone-scale, 1)); border: 0; border-radius: calc(18px * var(--phone-scale, 1)); background: rgb(255 255 255 / 54%); box-shadow: inset 0 0 0 1px rgb(59 55 119 / 13%); color: #3b3777; font-size: calc(10px * var(--phone-scale, 1)) !important; font-weight: 700 !important; transition: background .2s ease, transform .2s ease; }
.spc-map-button:hover { background: rgb(255 255 255 / 78%); transform: translateY(calc(-1px * var(--phone-scale, 1))); }
.spc-map-button svg { width: calc(16px * var(--phone-scale, 1)); height: calc(16px * var(--phone-scale, 1)); }
.spc-section { margin-top: calc(13px * var(--phone-scale, 1)); }
.spc-section h3 { margin: 0; padding: calc(9px * var(--phone-scale, 1)) 0 calc(5px * var(--phone-scale, 1)); color: #3b3777aa; font-size: calc(8px * var(--phone-scale, 1)); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.spc-entries { display: grid; gap: 0; }
.spc-entry { display: flex; align-items: center; gap: calc(16px * var(--phone-scale, 1)); width: 100%; padding: calc(16px * var(--phone-scale, 1)) calc(10px * var(--phone-scale, 1)); border: 0; border-radius: calc(15px * var(--phone-scale, 1)); background: transparent; text-align: left; transition: background .2s ease; }
.spc-entry + .spc-entry { margin-top: calc(10px * var(--phone-scale, 1)); border-top: 1px solid rgb(158 155 190 / 20%); box-shadow: 0 calc(-1px * var(--phone-scale, 1)) 0 rgb(255 255 255 / 20%); }
.spc-entry:hover { background: rgb(255 255 255 / 24%); }
.spc-entry:active { cursor: var(--cursor-pointerActive, pointer); }
.spc-entry:active .spc-badge { transform: translateY(calc(4px * var(--phone-scale, 1))); }
.spc-badge-wrapper { position: relative; display: grid; place-items: center; flex: 0 0 auto; width: calc(82px * var(--phone-scale, 1)); height: calc(82px * var(--phone-scale, 1)); }
.spc-badge { display: grid; place-items: center; width: calc(80px * var(--phone-scale, 1)); height: calc(80px * var(--phone-scale, 1)); overflow: hidden; border: calc(4px * var(--phone-scale, 1)) solid #dae3ed; border-radius: 50%; background: #fff; box-shadow: 0 calc(2px * var(--phone-scale, 1)) calc(6px * var(--phone-scale, 1)) rgb(59 55 119 / 15%); transition: transform .4s cubic-bezier(.23, 1, .32, 1); }
.spc-photo { width: 100%; height: 100%; object-fit: cover; background: #dce6fd; }
.spc-copy { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; padding: calc(2px * var(--phone-scale, 1)) 0; }
.spc-summary { margin: 0 0 calc(8px * var(--phone-scale, 1)); color: #3b3777; font-size: calc(13px * var(--phone-scale, 1)); font-weight: 500; line-height: 1.2; }
.spc-summary strong { color: #3b3777; font-weight: 700; }
.spc-tags { display: flex; flex-wrap: wrap; gap: calc(5px * var(--phone-scale, 1)); }
.spc-tag { max-width: 100%; padding: 0 calc(8px * var(--phone-scale, 1)); overflow: hidden; border: calc(1px * var(--phone-scale, 1)) solid rgb(59 55 119 / 20%); border-radius: calc(15px * var(--phone-scale, 1)); color: rgb(59 55 119 / 60%); font-size: calc(9px * var(--phone-scale, 1)); font-weight: 700; line-height: calc(16px * var(--phone-scale, 1)); text-overflow: ellipsis; text-transform: lowercase; white-space: nowrap; }
.spc-symbol { display: grid; place-items: center; width: 100%; height: 100%; color: #5f5a98; background: linear-gradient(135deg, #fff 0%, #eef0ff 100%); }
.spc-symbol svg { width: calc(31px * var(--phone-scale, 1)); height: calc(31px * var(--phone-scale, 1)); }
.spc-stage .spc-badge { border-color: #f2d9d4; }
.spc-stage .spc-symbol { color: #d36b68; background: linear-gradient(135deg, #fff8ef 0%, #ffe0db 100%); }
.spc-stage .spc-tag { border-color: rgb(210 109 105 / 25%); color: #bd615f; }
.spc-note { margin: calc(16px * var(--phone-scale, 1)) calc(4px * var(--phone-scale, 1)) 0; color: #625e96; font-size: calc(9px * var(--phone-scale, 1)); font-weight: 500; line-height: 1.5; text-align: center; }
.spc-status { margin: calc(8px * var(--phone-scale, 1)) 0 0; color: #c3646d; font-size: calc(10px * var(--phone-scale, 1)); font-weight: 700; }
.spc-status:empty { display: none; }
@media (max-height: 700px) and (min-width: 701px) { .spc-entry { min-height: calc(79px * var(--phone-scale, 1)); } .spc-badge-wrapper, .spc-badge { width: calc(66px * var(--phone-scale, 1)); height: calc(66px * var(--phone-scale, 1)); } .spc-summary { font-size: calc(11px * var(--phone-scale, 1)); } }
`;

const ICONS = {
  map: 'm9 3-6 3v15l6-3 6 3 6-3V3l-6 3-6-3Zm0 0v15m6-12v15',
  guide: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21v-3a7 7 0 0 1 14 0v3M12 13v5M10 16h4',
  music: 'M9 18V5l11-2v13M9 5v4l11-2M9 18c0 2-6 4-6 1s6-4 6-1m11-2c0 2-6 4-6 1s6-4 6-1',
};

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function icon(kind, className = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(key, value);
  if (className) svg.setAttribute('class', className);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICONS[kind]);
  svg.append(path);
  return svg;
}

/** Use the native Fintechs tab for culture, preserving the phone's navigation. */
export function installSultraPhoneCulture(game, {
  openTarget = (id) => game.sultraIsland?.ui?.openTarget(id),
  openMap = () => game.sultraIsland?.ui?.openMap(),
} = {}) {
  if (game.sultraPhoneCulture) return game.sultraPhoneCulture;
  const style = node('style');
  style.dataset.sultraPhoneCulture = '';
  style.textContent = STYLES;
  document.head.append(style);
  const views = new Set();
  let destroyed = false;

  function attach(tab) {
    if (tab.querySelector('.sultra-phone-culture')) return;
    const root = node('section', 'content sultra-phone-culture');
    root.lang = 'id';
    root.setAttribute('aria-label', 'Jelajah budaya Sulawesi Tenggara');
    root.dataset.scrollable = '';
    root.tabIndex = 0;
    const status = node('p', 'spc-status');
    status.setAttribute('role', 'status');
    const open = (callback) => {
      const result = callback();
      status.textContent = result === false || result === undefined
        ? 'Cerita tersedia setelah kamu tiba di pulau.' : '';
    };
    const showNativeMap = () => {
      const tabState = game.app?.$store?.phone?.tab;
      if (!tabState) return openMap();
      tabState.id = 'Map';
      return true;
    };

    function entry(content, kind) {
      const button = node('button', `spc-entry${kind === 'music' ? ' spc-stage' : ''}`);
      button.type = 'button';
      button.dataset.cultureId = content.id;
      button.setAttribute('aria-label', `Baca cerita ${content.title}`);
      const badgeWrapper = node('span', 'spc-badge-wrapper');
      const badge = node('span', 'spc-badge');
      if (kind === 'house' && content.image) {
        const image = node('img', 'spc-photo');
        image.src = content.image;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        badge.append(image);
      } else {
        const symbol = node('span', 'spc-symbol');
        symbol.append(icon(kind));
        badge.append(symbol);
      }
      badgeWrapper.append(badge);
      const copy = node('span', 'spc-copy');
      const summary = node('p', 'spc-summary');
      const subtitle = content.subtitle || 'Cerita budaya Sulawesi Tenggara';
      summary.append(node('strong', '', content.title.replace(/^Rumah Adat /i, '')),
        document.createTextNode(` — ${subtitle}`));
      const tags = node('span', 'spc-tags');
      tags.append(node('span', 'spc-tag', kind === 'house' ? 'Rumah adat' : kind === 'music' ? 'Musik & tari' : 'Pemandu budaya'),
        node('span', 'spc-tag', content.region));
      copy.append(summary, tags);
      button.append(badgeWrapper, copy);
      button.addEventListener('click', () => open(() => openTarget(content.id)));
      return button;
    }

    function section(title, entries, kind) {
      const section = node('section', 'spc-section');
      const cards = node('div', 'spc-entries');
      entries.forEach((content) => cards.append(entry(content, kind)));
      section.append(node('h3', '', title), cards);
      return section;
    }

    const heading = node('header', 'spc-heading');
    heading.append(node('p', 'spc-kicker', 'SULTRA RUPA · PULAU BUDAYA'),
      node('h2', '', 'Jelajahi Budaya'),
      node('p', '', 'Rumah adat, tradisi, dan cerita Sulawesi Tenggara.'));
    const map = node('button', 'spc-map-button');
    map.type = 'button';
    map.append(icon('map'), node('span', '', 'Peta pulau'));
    map.addEventListener('click', () => open(showNativeMap));
    heading.append(map, status);
    root.append(heading);
    const houses = HOUSE_EXHIBITS.filter((entry) => layout.houses.some((site) => site.id === entry.id));
    const guides = CULTURE_GUIDES.filter((entry) => layout.guides.some((site) => site.id === entry.id));
    root.append(section('Rumah adat', houses, 'house'));
    if (layout.stage || layout.luloStage) {
      root.append(section('Musik & tari bersama', [{
        id: 'lulo-stage', title: 'Panggung Lulo', region: 'Tolaki · Sulawesi Tenggara',
        subtitle: 'Temui penari dan dengarkan musik saat mendekati panggung.',
      }], 'music'));
    }
    root.append(section('Temui pemandu lokal', guides, 'guide'),
      node('p', 'spc-note', 'Dekati rumah yang bercahaya lalu tekan Space atau ketuk bangunannya. Dekati pemandu dan gunakan Space atau ikon chat.'));
    // Keep native phone drag and scroll handlers away from this scrollable pane.
    for (const eventName of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'wheel']) root.addEventListener(eventName, (event) => event.stopPropagation());
    tab.classList.add('sultra-phone-culture-active');
    tab.append(root);
    views.add({ tab, root });
  }

  function scan() {
    if (destroyed) return;
    for (const view of views) if (!view.root.isConnected) views.delete(view);
    document.querySelectorAll('.phone-tab.fintechs').forEach(attach);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
  const state = game.sultraPhoneCulture = {
    update: scan,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      for (const view of views) { view.root.remove(); view.tab.classList.remove('sultra-phone-culture-active'); }
      views.clear();
      style.remove();
      delete game.sultraPhoneCulture;
    },
  };
  return state;
}
