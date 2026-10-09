import { aS as Vector3 } from './vendor.75f6e6ae65453426.js';
import islandLayout from './sultra-island-layout.js';

const ICONS = {
  house: '<path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7M4 7l8-5 8 5"/>',
  guide: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3M12 13v5M10 16h4"/>',
  map: '<path d="m9 3-6 3v15l6-3 6 3 6-3V3l-6 3-6-3Zm0 0v15m6-12v15"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[name] || ICONS.house;
  return svg;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function action(className, label, symbol) {
  const button = element('button', className);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  if (symbol) button.append(icon(symbol));
  return button;
}

function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

/**
 * Culture overlays for the Sulawesi Tenggara island.
 * Positions and camera are in the same Three.js world coordinate system.
 * setTargets activates the interface; clear removes all island UI and content.
 */
export function createCultureUI({ onOpenChange = () => {} } = {}) {
  if (!document.querySelector('link[data-sultra-culture-style]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('./sultra-culture.css', import.meta.url).href;
    stylesheet.dataset.sultraCultureStyle = '';
    document.head.append(stylesheet);
  }

  const root = element('div', 'sultra-culture');
  root.hidden = true;
  root.setAttribute('lang', 'id');
  const markerLayer = element('div', 'sc-markers');
  markerLayer.setAttribute('aria-label', 'Tempat dan pemandu budaya');

  const hud = element('section', 'sc-hud');
  hud.setAttribute('aria-label', 'Jelajah budaya');
  const hudMark = element('span', 'sc-hud-mark');
  hudMark.append(icon('house'));
  const hudCopy = element('div', 'sc-hud-copy');
  hudCopy.append(
    element('span', 'sc-eyebrow', 'SULTRARUPA · PULAU BUDAYA'),
    element('h2', 'sc-hud-title', 'Jelajah Sulawesi Tenggara'),
    element('p', 'sc-hud-caption', 'Dekati rumah, temukan ceritanya.'),
  );
  const mapButton = action('sc-map-button', 'Buka peta budaya', 'map');
  mapButton.append(element('span', '', 'Peta budaya'));
  hud.append(hudMark, hudCopy, mapButton);

  const prompt = element('div', 'sc-nearby');
  prompt.hidden = true;
  prompt.setAttribute('role', 'status');
  const promptKey = element('kbd', '', 'E');
  const promptText = element('span');
  prompt.append(promptKey, promptText);

  const backdrop = element('div', 'sc-backdrop');
  backdrop.hidden = true;
  const panel = element('section', 'sc-panel');
  panel.tabIndex = -1;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const headingId = `sc-title-${Math.random().toString(36).slice(2, 9)}`;
  panel.setAttribute('aria-labelledby', headingId);

  const toolbar = element('div', 'sc-panel-toolbar');
  const backButton = action('sc-back-button', 'Kembali ke peta budaya', 'back');
  backButton.append(element('span', '', 'Peta budaya'));
  const panelBrand = element('span', 'sc-panel-brand', 'RUANG CERITA');
  const closeButton = action('sc-close-button', 'Tutup informasi budaya', 'close');
  closeButton.title = 'Tutup (Esc)';
  toolbar.append(backButton, panelBrand, closeButton);
  const body = element('div', 'sc-panel-body');
  panel.append(toolbar, body);
  backdrop.append(panel);
  root.append(markerLayer, hud, prompt, backdrop);
  document.body.append(root);

  let targets = [];
  let markers = [];
  let nearest = null;
  let opened = false;
  let destroyed = false;
  let returnFocus = null;
  let lastPrompt = '';
  let suppressedKey = '';
  let inertNodes = [];
  let mapPlayer = null;
  let playerPositionOnMap = null;
  const projected = new Vector3();
  const cameraSpace = new Vector3();
  const mapWidth = 440;
  const mapHeight = 300;
  const [[minX, , minZ], [maxX, , maxZ]] = islandLayout.bounds;
  const mapScale = Math.min((mapWidth - 46) / (maxX - minX), (mapHeight - 34) / (maxZ - minZ));
  const mapOffsetX = (mapWidth - (maxX - minX) * mapScale) / 2;
  const mapOffsetZ = (mapHeight - (maxZ - minZ) * mapScale) / 2;

  function mapPoint(x, z) {
    return [mapOffsetX + (x - minX) * mapScale, mapOffsetZ + (z - minZ) * mapScale];
  }

  function moveMapPlayer() {
    if (!mapPlayer || !playerPositionOnMap) return;
    const [x, y] = mapPoint(playerPositionOnMap.x, playerPositionOnMap.z);
    mapPlayer.style.left = `${x / mapWidth * 100}%`;
    mapPlayer.style.top = `${y / mapHeight * 100}%`;
    mapPlayer.hidden = x < 0 || x > mapWidth || y < 0 || y > mapHeight;
  }

  function setOpen(next) {
    if (opened === next) return;
    opened = next;
    backdrop.hidden = !next;
    root.classList.toggle('sc-is-open', next);
    markerLayer.setAttribute('aria-hidden', String(next));
    markerLayer.inert = next;
    hud.inert = next;
    if (next) {
      returnFocus = document.activeElement;
      // Native inert keeps tab focus and assistive technology inside the dialog.
      inertNodes = [...document.body.children]
        .filter((node) => node !== root && !node.inert && node instanceof HTMLElement);
      inertNodes.forEach((node) => { node.inert = true; });
      if (document.pointerLockElement) document.exitPointerLock?.();
      closeButton.focus({ preventScroll: true });
    } else {
      inertNodes.forEach((node) => { node.inert = false; });
      inertNodes = [];
      if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) {
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
    }
    onOpenChange(next);
  }

  function titleBlock(kicker, title, subtitle) {
    const intro = element('header', 'sc-intro');
    intro.append(element('p', 'sc-eyebrow', kicker));
    const heading = element('h2', 'sc-title', title);
    heading.id = headingId;
    intro.append(heading);
    if (subtitle) intro.append(element('p', 'sc-subtitle', subtitle));
    return intro;
  }

  function photo(target, className) {
    if (!target.image) return null;
    const url = safeUrl(target.image);
    if (!url) return null;
    const image = element('img', className);
    image.src = url;
    image.alt = `${target.title}${target.region ? `, ${target.region}` : ''}`;
    image.decoding = 'async';
    image.addEventListener('error', () => { image.hidden = true; }, { once: true });
    return image;
  }

  function showTarget(target, viaMap = false) {
    if (!target || destroyed) return;
    mapPlayer = null;
    backButton.hidden = !viaMap;
    panelBrand.hidden = viaMap;
    body.replaceChildren();
    body.append(titleBlock(
      `${target.kind === 'guide' ? 'PANDUAN BUDAYA' : 'RUMAH ADAT'}${target.region ? ` · ${target.region.toUpperCase()}` : ''}`,
      target.title,
      target.subtitle,
    ));
    const image = photo(target, 'sc-hero-photo');
    if (image) {
      const figure = element('figure', 'sc-photo');
      figure.append(image);
      figure.append(element('figcaption', '', `Mengenal ${target.title}${target.region ? ` · ${target.region}` : ''}`));
      body.append(figure);
    }
    const description = element('div', 'sc-description');
    (target.description || []).forEach((paragraph) => description.append(element('p', '', paragraph)));
    body.append(description);
    if (target.facts?.length) {
      const facts = element('section', 'sc-facts');
      facts.append(element('h3', '', 'Tahukah kamu?'));
      const list = element('ul');
      target.facts.forEach((fact) => list.append(element('li', '', fact)));
      facts.append(list);
      body.append(facts);
    }
    if (target.sources?.length) {
      const sources = element('section', 'sc-sources');
      sources.append(element('h3', '', 'Baca lebih jauh'));
      const list = element('ul');
      target.sources.forEach((source) => {
        const url = safeUrl(source.url);
        if (!url) return;
        const item = element('li');
        const link = element('a', '', source.title);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${source.title} (buka tab baru)`);
        link.append(element('span', 'sc-external', ' ↗'));
        item.append(link);
        list.append(item);
      });
      sources.append(list);
      body.append(sources);
    }
    body.append(element('p', 'sc-panel-footnote', 'Warisan yang beragam, cerita yang terus hidup.'));
    body.scrollTop = 0;
    setOpen(true);
    closeButton.focus({ preventScroll: true });
  }

  function showMap() {
    if (destroyed || !targets.length) return;
    backButton.hidden = true;
    panelBrand.hidden = false;
    body.replaceChildren();
    body.append(titleBlock('JELAJAH SULAWESI TENGGARA', 'Peta budaya', 'Kenali rumah adat dan cerita masyarakat di baliknya. Pilih sebuah tempat untuk mulai membaca.'));
    const houses = targets.filter((target) => target.kind === 'house');
    const guides = targets.filter((target) => target.kind === 'guide');
    const map = element('div', 'sc-island-chart');
    map.setAttribute('role', 'group');
    map.setAttribute('aria-label', 'Peta pulau dengan empat lokasi rumah adat. Penempatan merupakan interpretasi ruang belajar.');
    const mapSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mapSvg.setAttribute('viewBox', `0 0 ${mapWidth} ${mapHeight}`);
    mapSvg.setAttribute('aria-hidden', 'true');
    const coastline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    coastline.setAttribute('d', `${islandLayout.outline.map(([x, z], index) => `${index ? 'L' : 'M'}${mapPoint(x, z).join(',')}`).join(' ')} Z`);
    coastline.classList.add('sc-map-land');
    mapSvg.append(coastline);
    (islandLayout.paths || []).forEach((points) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', points.map(([x, z], index) => `${index ? 'L' : 'M'}${mapPoint(x, z).join(',')}`).join(' '));
      path.classList.add('sc-map-trail');
      mapSvg.append(path);
    });
    map.append(mapSvg);
    const compass = element('span', 'sc-map-compass', '↑');
    compass.append(element('span', '', 'U'));
    compass.setAttribute('aria-hidden', 'true');
    map.append(compass, element('span', 'sc-map-sea', 'LAUT BANDA'));
    islandLayout.guides.forEach((guide) => {
      const [x, y] = mapPoint(guide.x, guide.z);
      const dot = element('span', 'sc-map-guide-dot');
      dot.style.left = `${x / mapWidth * 100}%`;
      dot.style.top = `${y / mapHeight * 100}%`;
      dot.setAttribute('aria-hidden', 'true');
      map.append(dot);
    });
    houses.forEach((target, index) => {
      const location = islandLayout.houses.find((house) => house.id === target.id) || target.position;
      const [x, y] = mapPoint(location.x, location.z);
      const pin = action('sc-map-pin', `Lokasi ${index + 1}: ${target.title}`);
      pin.textContent = String(index + 1).padStart(2, '0');
      pin.title = target.title;
      pin.style.left = `${x / mapWidth * 100}%`;
      pin.style.top = `${y / mapHeight * 100}%`;
      pin.append(element('span', 'sc-map-pin-label', target.title));
      pin.addEventListener('click', () => showTarget(target, true));
      map.append(pin);
    });
    mapPlayer = element('span', 'sc-map-player');
    mapPlayer.setAttribute('role', 'img');
    mapPlayer.setAttribute('aria-label', 'Posisimu di pulau');
    mapPlayer.title = 'Posisimu';
    mapPlayer.hidden = !playerPositionOnMap;
    map.append(mapPlayer);
    moveMapPlayer();
    body.append(map);
    const legend = element('div', 'sc-map-legend');
    legend.append(element('span', 'sc-legend-house', 'Rumah adat'), element('span', 'sc-legend-guide', 'Pemandu'), element('span', 'sc-legend-player', 'Posisimu'));
    body.append(legend, element('p', 'sc-map-context', 'Siluet Pulau Sulawesi. Letak rumah di ruang belajar ini bersifat interpretatif, bukan lokasi geografis sebenarnya.'));
    const count = element('div', 'sc-directory-label', `${houses.length} RUMAH ADAT · SATU PERJALANAN`);
    body.append(count);
    const directory = element('div', 'sc-directory');
    houses.forEach((target, index) => {
      const button = action('sc-place', `Jelajahi ${target.title}, ${target.region || 'Sulawesi Tenggara'}`);
      const image = photo(target, 'sc-place-photo');
      if (image) button.append(image);
      else {
        const symbol = element('span', 'sc-place-symbol');
        symbol.append(icon('house'));
        button.append(symbol);
      }
      const copy = element('span', 'sc-place-copy');
      copy.append(
        element('span', 'sc-place-number', `${String(index + 1).padStart(2, '0')} / ${target.region || 'Sulawesi Tenggara'}`),
        element('span', 'sc-place-title', target.title),
      );
      if (target.subtitle) copy.append(element('span', 'sc-place-subtitle', target.subtitle));
      button.append(copy, icon('arrow'));
      button.addEventListener('click', () => showTarget(target, true));
      directory.append(button);
    });
    body.append(directory);
    if (guides.length) {
      body.append(element('h3', 'sc-guide-heading', 'Temui pemandu lokal'));
      guides.forEach((target) => {
        const guide = action('sc-guide-card', `Baca cerita ${target.title}`);
        const guideIcon = element('span', 'sc-guide-icon');
        guideIcon.append(icon('guide'));
        const copy = element('span', 'sc-place-copy');
        copy.append(element('span', 'sc-place-title', target.title));
        copy.append(element('span', 'sc-place-subtitle', target.subtitle || 'Cerita, tradisi, dan kearifan lokal.'));
        guide.append(guideIcon, copy, icon('arrow'));
        guide.addEventListener('click', () => showTarget(target, true));
        body.append(guide);
      });
    }
    body.append(element('p', 'sc-map-hint', 'Di pulau, dekati ikon rumah atau pemandu. Tekan E atau ketuk ikon untuk membuka cerita.'));
    body.scrollTop = 0;
    setOpen(true);
    closeButton.focus({ preventScroll: true });
  }

  function close() {
    setOpen(false);
  }

  function stopGamePointer(event) {
    if (opened || event.target.closest('button, a')) event.stopPropagation();
  }

  function onKeyDown(event) {
    if (root.hidden || destroyed) return;
    if (opened) {
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        suppressedKey = event.code;
        close();
      } else if (event.key === 'Tab') {
        const focusable = [...panel.querySelectorAll('button:not([hidden]), a[href]')]
          .filter((node) => !node.closest('[hidden]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault();
          first?.focus();
        }
      } else if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Space'].includes(event.code) && !['BUTTON', 'A'].includes(event.target.tagName)) {
        event.preventDefault();
      }
      return;
    }
    if (document.documentElement.classList.contains('sultra-phone-open')) return;
    if (event.code === 'KeyE' && nearest && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !event.target.closest('input, textarea, [contenteditable="true"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressedKey = event.code;
      showTarget(nearest.target);
    }
  }

  function onKeyUp(event) {
    if (opened || (suppressedKey && event.code === suppressedKey)) {
      event.stopImmediatePropagation();
      if (event.code === suppressedKey) suppressedKey = '';
    }
  }

  mapButton.addEventListener('click', showMap);
  backButton.addEventListener('click', showMap);
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); });
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'wheel'].forEach((name) => {
    root.addEventListener(name, stopGamePointer);
  });
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);

  function clear() {
    close();
    targets = [];
    markers = [];
    nearest = null;
    lastPrompt = '';
    mapPlayer = null;
    playerPositionOnMap = null;
    markerLayer.replaceChildren();
    body.replaceChildren();
    prompt.hidden = true;
    root.hidden = true;
  }

  return {
    openTarget(id) {
      const target = targets.find((entry) => entry.id === id);
      if (!target || destroyed) return false;
      showTarget(target);
      return true;
    },
    openMap() {
      if (destroyed || !targets.length) return false;
      showMap();
      return true;
    },
    setTargets(nextTargets = []) {
      if (destroyed) return;
      clear();
      targets = nextTargets.filter((target) => target?.position && ['house', 'guide'].includes(target.kind));
      markers = targets.map((target) => {
        const button = action(`sc-marker sc-marker-${target.kind}`, `${target.kind === 'guide' ? 'Baca cerita pemandu' : 'Jelajahi rumah adat'} ${target.title}`, target.kind);
        button.title = target.title;
        button.hidden = true;
        button.append(element('span', 'sc-marker-label', target.title));
        button.addEventListener('click', () => showTarget(target));
        markerLayer.append(button);
        return { target, button, distance: Infinity };
      });
      root.hidden = !targets.length;
    },
    update(camera, playerPosition) {
      if (destroyed || root.hidden || !camera || !playerPosition) return;
      playerPositionOnMap = { x: playerPosition.x, z: playerPosition.z };
      moveMapPlayer();
      camera.updateMatrixWorld?.();
      let nextNearest = null;
      let nearestDistance = 15;
      const width = window.innerWidth;
      const height = window.innerHeight;
      for (const marker of markers) {
        const { target, button } = marker;
        const { x, y, z } = target.position;
        // Roof and speech icons sit above the interaction point on the ground.
        const distance = Math.hypot(x - playerPosition.x, z - playerPosition.z);
        marker.distance = distance;
        let visible = distance <= (target.kind === 'guide' ? 30 : 100);
        if (visible) {
          cameraSpace.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          projected.set(x, y, z).project(camera);
          visible = cameraSpace.z < 0 && projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.9;
        }
        button.hidden = !visible;
        if (!visible) continue;
        button.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
        button.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
        button.classList.toggle('sc-marker-distant', distance > 45);
        if (distance <= nearestDistance) {
          nextNearest = marker;
          nearestDistance = distance;
        }
      }
      if (nearest !== nextNearest) {
        nearest?.button.classList.remove('sc-marker-nearest');
        nearest = nextNearest;
        nearest?.button.classList.add('sc-marker-nearest');
      }
      prompt.hidden = !nearest || opened;
      if (nearest && lastPrompt !== nearest.target.id) {
        promptText.textContent = `Jelajahi ${nearest.target.title}`;
        lastPrompt = nearest.target.id;
      }
    },
    clear,
    destroy() {
      if (destroyed) return;
      clear();
      destroyed = true;
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      root.remove();
    },
  };
}
