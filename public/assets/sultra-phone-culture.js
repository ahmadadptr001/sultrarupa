import { HOUSE_EXHIBITS, CULTURE_GUIDES } from './sultra-culture-data.js';
import layout from './sultra-island-layout.js';

const STYLES = `
.phone-tab.fintechs.sultra-phone-culture-active > .content:not(.sultra-phone-culture) { display: none !important; }
.sultra-phone-culture { --spc-brand: #3b3777; --spc-brand-soft: #f2f1fb; --spc-teal: #02c6a7; --spc-teal-dark: #008f7c; --spc-coral: #f2676f; --spc-muted: #76739f; --spc-line: #ecebf8; position: absolute !important; top: calc(100px * var(--phone-scale, 1)) !important; right: 0 !important; bottom: 0 !important; left: 0 !important; z-index: 1; display: block !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; box-sizing: border-box; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; padding: 0 calc(22px * var(--phone-scale, 1)) calc(26px * var(--phone-scale, 1)) !important; color: var(--spc-brand); background: transparent !important; font: 500 calc(13px * var(--phone-scale, 1))/1.35 Gilmer, "Avenir Next", sans-serif; cursor: default; scrollbar-width: thin; scrollbar-color: #9e9bbe66 transparent; touch-action: pan-y; }
.sultra-phone-culture * { box-sizing: border-box; }
.spc-heading { margin: 0 0 calc(17px * var(--phone-scale, 1)); padding: 0 calc(2px * var(--phone-scale, 1)); text-align: left; }
.spc-kicker { margin: 0 0 calc(5px * var(--phone-scale, 1)); color: var(--spc-teal-dark); font-size: calc(8px * var(--phone-scale, 1)); font-weight: 700; letter-spacing: .13em; }
.sultra-phone-culture h2 { margin: 0 0 calc(5px * var(--phone-scale, 1)); font: 700 calc(25px * var(--phone-scale, 1))/1.08 Comfortaa, Gilmer, sans-serif; letter-spacing: -.02em; color: var(--spc-brand); text-shadow: none; }
.spc-lede { max-width: calc(310px * var(--phone-scale, 1)); margin: 0; color: var(--spc-muted); font-size: calc(12px * var(--phone-scale, 1)); font-weight: 500; line-height: 1.4; }
.sultra-phone-culture button { font: inherit; cursor: var(--cursor-pointer, pointer); color: inherit; -webkit-tap-highlight-color: transparent; }
.sultra-phone-culture button:focus-visible { outline: calc(3px * var(--phone-scale, 1)) solid var(--spc-teal); outline-offset: calc(3px * var(--phone-scale, 1)); }
.spc-map-button { display: inline-flex; align-items: center; justify-content: center; gap: calc(7px * var(--phone-scale, 1)); min-height: calc(33px * var(--phone-scale, 1)); padding: calc(6px * var(--phone-scale, 1)) calc(14px * var(--phone-scale, 1)); margin-top: calc(12px * var(--phone-scale, 1)); border: 0; border-radius: calc(999px * var(--phone-scale, 1)); background: var(--spc-teal); box-shadow: 0 calc(3px * var(--phone-scale, 1)) 0 #86e0cf, 0 calc(7px * var(--phone-scale, 1)) calc(14px * var(--phone-scale, 1)) rgb(2 198 167 / 20%); color: #fff; font-size: calc(10.5px * var(--phone-scale, 1)) !important; font-weight: 700 !important; transition: background .2s ease, box-shadow .2s ease, transform .2s ease; }
.spc-map-button:hover { background: #00bfa3; box-shadow: 0 calc(4px * var(--phone-scale, 1)) 0 #86e0cf, 0 calc(9px * var(--phone-scale, 1)) calc(16px * var(--phone-scale, 1)) rgb(2 198 167 / 24%); transform: translateY(calc(-1px * var(--phone-scale, 1))); }
.spc-map-button:active { box-shadow: 0 calc(1px * var(--phone-scale, 1)) 0 #86e0cf; transform: translateY(calc(2px * var(--phone-scale, 1))); }
.spc-map-button svg { width: calc(16px * var(--phone-scale, 1)); height: calc(16px * var(--phone-scale, 1)); }
.spc-section { margin-top: calc(18px * var(--phone-scale, 1)); }
.spc-section h3 { display: flex; align-items: center; gap: calc(8px * var(--phone-scale, 1)); margin: 0; padding: 0 calc(4px * var(--phone-scale, 1)) calc(8px * var(--phone-scale, 1)); color: #7a77a4; font-size: calc(8.5px * var(--phone-scale, 1)); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.spc-section h3::after { flex: 1 1 auto; height: 1px; background: rgb(59 55 119 / 12%); content: ""; }
.spc-entries { display: grid; gap: calc(9px * var(--phone-scale, 1)); }
.spc-entry { display: flex; align-items: center; gap: calc(12px * var(--phone-scale, 1)); width: 100%; padding: calc(10px * var(--phone-scale, 1)); border: 1px solid #fff; border-radius: calc(19px * var(--phone-scale, 1)); background: #fff; box-shadow: 0 calc(5px * var(--phone-scale, 1)) calc(16px * var(--phone-scale, 1)) rgb(59 55 119 / 8%); text-align: left; transition: background .2s ease, box-shadow .2s ease, transform .2s ease; }
.spc-entry + .spc-entry { margin-top: 0; border-top: 1px solid #fff; box-shadow: 0 calc(5px * var(--phone-scale, 1)) calc(16px * var(--phone-scale, 1)) rgb(59 55 119 / 8%); }
.spc-entry:hover { background: #fdfcff; box-shadow: 0 calc(7px * var(--phone-scale, 1)) calc(20px * var(--phone-scale, 1)) rgb(59 55 119 / 12%); transform: translateY(calc(-1px * var(--phone-scale, 1))); }
.spc-entry:active { cursor: var(--cursor-pointerActive, pointer); transform: scale(.985); }
.spc-badge-wrapper { position: relative; display: grid; place-items: center; flex: 0 0 auto; width: calc(68px * var(--phone-scale, 1)); height: calc(68px * var(--phone-scale, 1)); }
.spc-badge { display: grid; place-items: center; width: calc(66px * var(--phone-scale, 1)); height: calc(66px * var(--phone-scale, 1)); overflow: hidden; border: calc(3px * var(--phone-scale, 1)) solid #f7f6fc; border-radius: calc(18px * var(--phone-scale, 1)); background: #fff; box-shadow: 0 calc(2px * var(--phone-scale, 1)) calc(8px * var(--phone-scale, 1)) rgb(59 55 119 / 14%); transition: transform .4s cubic-bezier(.23, 1, .32, 1); }
.spc-photo { width: 100%; height: 100%; object-fit: cover; background: #dce6fd; }
.spc-copy { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; padding: calc(1px * var(--phone-scale, 1)) 0; }
.spc-summary { display: grid; gap: calc(3px * var(--phone-scale, 1)); margin: 0 0 calc(7px * var(--phone-scale, 1)); color: var(--spc-brand); }
.spc-summary strong { overflow: hidden; color: var(--spc-brand); font-size: calc(13px * var(--phone-scale, 1)); font-weight: 700; line-height: 1.28; text-overflow: ellipsis; }
.spc-subtitle { display: -webkit-box; overflow: hidden; color: var(--spc-muted); font-size: calc(10.5px * var(--phone-scale, 1)); font-weight: 500; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.spc-tags { display: flex; flex-wrap: wrap; gap: calc(5px * var(--phone-scale, 1)); }
.spc-tag { max-width: 100%; padding: 0 calc(7px * var(--phone-scale, 1)); overflow: hidden; border: 0; border-radius: calc(999px * var(--phone-scale, 1)); background: var(--spc-brand-soft); color: #77749f; font-size: calc(8px * var(--phone-scale, 1)); font-weight: 700; line-height: calc(17px * var(--phone-scale, 1)); text-overflow: ellipsis; white-space: nowrap; }
.spc-tag-kind { background: #e8faf6; color: var(--spc-teal-dark); }
.spc-entry-music .spc-tag-kind { background: #fff1f0; color: #c5525b; }
.spc-symbol { display: grid; place-items: center; width: 100%; height: 100%; color: #5f5a98; background: linear-gradient(135deg, #fff 0%, #efeffa 100%); }
.spc-entry-music .spc-symbol { color: #d9575f; background: linear-gradient(135deg, #fff 0%, #ffeceb 100%); }
.spc-symbol svg { width: calc(27px * var(--phone-scale, 1)); height: calc(27px * var(--phone-scale, 1)); }
.spc-chevron { display: grid; place-items: center; flex: 0 0 auto; width: calc(16px * var(--phone-scale, 1)); color: #b9b7d4; }
.spc-chevron svg { width: calc(16px * var(--phone-scale, 1)); height: calc(16px * var(--phone-scale, 1)); }
.spc-note { margin: calc(18px * var(--phone-scale, 1)) 0 0; padding: calc(12px * var(--phone-scale, 1)) calc(14px * var(--phone-scale, 1)); border-radius: calc(16px * var(--phone-scale, 1)); background: rgb(255 255 255 / 55%); color: #67639a; font-size: calc(9.5px * var(--phone-scale, 1)); font-weight: 500; line-height: 1.5; text-align: left; }
.spc-status { margin: calc(8px * var(--phone-scale, 1)) 0 0; color: #c5525b; font-size: calc(10px * var(--phone-scale, 1)); font-weight: 700; }
.spc-status:empty { display: none; }
`;

const ICONS = {
  map: 'm9 3-6 3v15l6-3 6 3 6-3V3l-6 3-6-3Zm0 0v15m6-12v15',
  guide: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21v-3a7 7 0 0 1 14 0v3M12 13v5M10 16h4',
  music: 'M9 18V5l11-2v13M9 5v4l11-2M9 18c0 2-6 4-6 1s6-4 6-1m11-2c0 2-6 4-6 1s6-4 6-1',
  chevron: 'm9 5 7 7-7 7',
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
  openTarget = (id, options) => game.sultraIsland?.ui?.openTarget(id, options),
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
      const button = node('button', `spc-entry spc-entry-${kind}`);
      button.type = 'button';
      button.dataset.cultureId = content.id;
      button.setAttribute('aria-label', `Buka informasi ${content.title}`);
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
      const summary = node('span', 'spc-summary');
      summary.append(
        node('strong', '', content.title.replace(/^Rumah Adat /i, '')),
        node('span', 'spc-subtitle', content.subtitle || 'Cerita budaya Sulawesi Tenggara'),
      );
      const tags = node('span', 'spc-tags');
      tags.append(node('span', 'spc-tag spc-tag-kind', kind === 'house' ? 'Rumah adat' : kind === 'music' ? 'Musik & tari' : 'Pemandu budaya'));
      if (content.region) tags.append(node('span', 'spc-tag', content.region.charAt(0).toUpperCase() + content.region.slice(1)));
      copy.append(summary, tags);
      const chevron = node('span', 'spc-chevron');
      chevron.append(icon('chevron'));
      button.append(badgeWrapper, copy, chevron);
      button.addEventListener('click', () => open(() => openTarget(content.id, { fromPhone: true })));
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
      node('p', 'spc-lede', 'Rumah adat, tradisi, dan cerita Sulawesi Tenggara.'));
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

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (added.nodeType !== 1) continue;
        if (added.matches('.phone-tab.fintechs') || added.querySelector('.phone-tab.fintechs')) {
          scan();
          return;
        }
      }
    }
  });
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
