import {
  cD as assets, cd as Group, b5 as Mesh, a$ as MeshBasicMaterial,
  cF as PlaneGeometry, ct as Texture, aS as Vector3, aT as Vector2,
  cV as Raycaster,
} from './vendor.75f6e6ae65453426.js';
import { convertMaterials } from './opening-boat.js';
import { assetUrl } from './asset-urls.js';
import { HOUSE_GALLERIES } from './sultra-gallery-data.js';

const FRAME_URL = '/models/interiors/bingkai.glb';
const FRAME_WIDTH = 1.32865;
const FRAME_HEIGHT = 1.90241;
const FRAME_SCALE = 1.25;
const APERTURE_WIDTH = 0.92;
const APERTURE_HEIGHT = 1.42;
const FOCUS_DURATION = 650;
const MAX_FOCUS_DISTANCE = 14;
// Four paintings face the entrance; each side wall carries two more. The side
// positions sit between the room's timber uprights at Z -5.2, 0 and 5.2.
const FRAME_MOUNTS = [
  { position: [-5.4, 2.5, 7.72], rotation: Math.PI, wall: 'front' },
  { position: [-1.8, 2.5, 7.72], rotation: Math.PI, wall: 'front' },
  { position: [1.8, 2.5, 7.72], rotation: Math.PI, wall: 'front' },
  { position: [5.4, 2.5, 7.72], rotation: Math.PI, wall: 'front' },
  { position: [-7.72, 2.5, 2.6], rotation: Math.PI / 2, wall: 'left' },
  { position: [-7.72, 2.5, -2.6], rotation: Math.PI / 2, wall: 'left' },
  { position: [7.72, 2.5, 2.6], rotation: -Math.PI / 2, wall: 'right' },
  { position: [7.72, 2.5, -2.6], rotation: -Math.PI / 2, wall: 'right' },
];
const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex="0"]';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  if (tag === 'button') node.type = 'button';
  return node;
}

function link(text, url) {
  const node = element('a', '', text);
  node.href = url;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  return node;
}

function disposeFrame(model) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  model?.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

// This module is only imported by the lazy interior. Neither the frame nor its
// photographs are requested until a visitor actually enters a particular house.
export function createInteriorGallery({ scene, camera, root, stage, onLock }) {
  let destroyed = false;
  let active = false;
  let generation = 0;
  let houseId = null;
  let status = 'idle';
  let frameModel = null;
  let framePromise = null;
  let selected = null;
  let gazed = null;
  let transition = null;
  let savedPose = null;
  let previousFocus = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const originalStageLabel = stage.getAttribute('aria-label');
  const images = new Map();
  const records = [];
  const group = new Group();
  group.name = 'SultraInteriorGallery';
  scene.add(group);
  const plane = new PlaneGeometry(1, 1);
  const backingMaterial = new MeshBasicMaterial({ color: 0xf5eddb, fog: false, toneMapped: false });
  // Keeping the cheap hit surface invisible through its material still permits
  // raycasting, without raycasting every carved triangle of the ornate frame.
  const hitMaterial = new MeshBasicMaterial({ visible: false });
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const forward = new Vector3();
  const direction = new Vector3();
  const projected = new Vector3();
  const lookTarget = new Vector3();

  const markers = element('div', 'sci-gallery-markers');
  const notice = element('div', 'sci-gallery-status');
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.hidden = true;
  const focus = element('div', 'sci-gallery-focus');
  focus.hidden = true;
  const back = element('button', 'sci-gallery-back', '← Kembali ke ruangan');
  const summary = element('button', 'sci-gallery-summary');
  summary.setAttribute('aria-expanded', 'false');
  summary.setAttribute('aria-controls', 'sci-gallery-details');
  const category = element('span', 'sci-gallery-category');
  const title = element('h3', 'sci-gallery-title');
  const description = element('p', 'sci-gallery-description');
  const more = element('span', 'sci-gallery-more', 'Baca cerita lengkap ↗');
  summary.append(category, title, description, more);
  focus.append(back, summary);
  const details = element('div', 'sci-gallery-details');
  details.id = 'sci-gallery-details';
  details.hidden = true;
  details.setAttribute('role', 'dialog');
  details.setAttribute('aria-modal', 'true');
  details.setAttribute('aria-labelledby', 'sci-gallery-detail-title');
  const sheet = element('div', 'sci-gallery-sheet');
  const detailBack = element('button', 'sci-gallery-detail-back', '← Kembali ke foto');
  const detailCategory = element('span', 'sci-gallery-category');
  const detailTitle = element('h3', 'sci-gallery-title');
  detailTitle.id = 'sci-gallery-detail-title';
  const detailBody = element('div', 'sci-gallery-body');
  sheet.append(detailBack, detailCategory, detailTitle, detailBody);
  details.append(sheet);
  root.append(markers, notice, focus, details);

  function setStatus(value) {
    status = value;
    root.dataset.galleryStatus = value;
  }

  function loadFrame() {
    if (frameModel) return Promise.resolve(frameModel);
    if (framePromise) return framePromise;
    framePromise = assets.load(assetUrl(FRAME_URL), { noCache: true, loader: 'gltf' }).then((gltf) => {
      const model = gltf.scene;
      convertMaterials(model);
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          material.fog = false;
          material.toneMapped = false;
          if (material.map) {
            material.map.encoding = 3000;
            material.map.anisotropy = 4;
            material.map.needsUpdate = true;
          }
        }
      });
      if (destroyed) {
        disposeFrame(model);
        throw new Error('Interior gallery has been destroyed');
      }
      frameModel = model;
      return model;
    }).catch((error) => {
      framePromise = null;
      throw error;
    });
    return framePromise;
  }

  function loadImage(url) {
    if (images.has(url)) return images.get(url);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try {
          if (image.decode) await image.decode();
          if (destroyed) throw new Error('Interior gallery has been destroyed');
          const texture = new Texture(image);
          texture.encoding = 3000;
          texture.anisotropy = 4;
          texture.needsUpdate = true;
          resolve({ texture, ratio: image.naturalWidth / image.naturalHeight });
        } catch (error) { reject(error); }
      };
      image.onerror = () => reject(new Error(`Gallery photograph unavailable: ${url}`));
      image.src = url;
    }).catch((error) => {
      images.delete(url);
      throw error;
    });
    images.set(url, promise);
    return promise;
  }

  function clearFrames() {
    for (const record of records) {
      record.photo.material.dispose();
      record.marker.remove();
      group.remove(record.object);
    }
    records.length = 0;
    gazed = null;
  }

  function makeFrame(entry, image, index, model) {
    const landscape = image.ratio > 1.15;
    const object = new Group();
    object.name = `Gallery_${entry.id}`;
    const mountPoint = FRAME_MOUNTS[index];
    object.position.fromArray(mountPoint.position);
    object.rotation.y = mountPoint.rotation;
    object.scale.setScalar(FRAME_SCALE);
    const mount = new Group();
    const carving = model.clone(true);
    carving.position.y -= FRAME_HEIGHT / 2;
    mount.add(carving);
    if (landscape) mount.rotation.z = Math.PI / 2;
    object.add(mount);
    const width = landscape ? APERTURE_HEIGHT : APERTURE_WIDTH;
    const height = landscape ? APERTURE_WIDTH : APERTURE_HEIGHT;
    // The opening is slightly off-center in the authored model. Rotate its
    // center along with the carving, while keeping the photograph upright.
    const photoX = landscape ? -(0.949 - FRAME_HEIGHT / 2) : 0.0012;
    const photoY = landscape ? 0.0012 : 0.949 - FRAME_HEIGHT / 2;
    const backing = new Mesh(plane, backingMaterial);
    backing.position.set(photoX, photoY, -0.006);
    backing.scale.set(width, height, 1);
    object.add(backing);
    const photo = new Mesh(plane, new MeshBasicMaterial({
      map: image.texture, fog: false, toneMapped: false,
    }));
    photo.position.set(photoX, photoY, -0.0057);
    // Some archival photos were embedded with rotation in their source PDF.
    // Correct the photo independently of the decorative frame orientation.
    photo.rotation.z = entry.imageRotation || 0;
    const photoWidth = Math.min(width, height * image.ratio);
    photo.scale.set(photoWidth, photoWidth / image.ratio, 1);
    object.add(photo);
    const frameWidth = landscape ? FRAME_HEIGHT : FRAME_WIDTH;
    const frameHeight = landscape ? FRAME_WIDTH : FRAME_HEIGHT;
    const hit = new Mesh(plane, hitMaterial);
    hit.scale.set(frameWidth, frameHeight, 1);
    hit.position.z = 0.08;
    object.add(hit);
    group.add(object);
    const marker = element('button', 'sci-gallery-marker');
    marker.dataset.galleryWall = mountPoint.wall;
    marker.hidden = true;
    marker.setAttribute('aria-label', `Lihat foto ${entry.title}`);
    const triangle = element('span', 'sci-gallery-triangle');
    triangle.setAttribute('aria-hidden', 'true');
    marker.append(triangle, element('span', 'sci-gallery-label', entry.title));
    markers.append(marker);
    const record = {
      entry, object, photo, hit, marker,
      center: object.position.clone(),
      normal: new Vector3(0, 0, 1).applyQuaternion(object.quaternion),
      width: frameWidth * FRAME_SCALE,
      height: frameHeight * FRAME_SCALE,
    };
    hit.userData.galleryRecord = record;
    marker.addEventListener('click', () => focusFrame(record));
    return record;
  }

  async function setHouse(id) {
    if (destroyed) return false;
    hide();
    active = true;
    houseId = id;
    group.visible = false;
    clearFrames();
    const entries = HOUSE_GALLERIES[id] || [];
    if (!entries.length) {
      setStatus('empty');
      return false;
    }
    const request = ++generation;
    setStatus('loading');
    notice.replaceChildren(document.createTextNode('Menyiapkan galeri budaya…'));
    notice.hidden = false;
    try {
      const [model, photographs] = await Promise.all([
        loadFrame(), Promise.all(entries.map((entry) => loadImage(entry.image))),
      ]);
      if (destroyed || !active || request !== generation) return false;
      for (let index = 0; index < entries.length; index++) {
        records.push(makeFrame(entries[index], photographs[index], index, model));
      }
      group.visible = true;
      group.updateMatrixWorld(true);
      notice.hidden = true;
      setStatus('ready');
      return true;
    } catch (error) {
      if (destroyed || !active || request !== generation) return false;
      console.warn('[Sultrarupa gallery]', error);
      setStatus('error');
      const retry = element('button', '', 'Coba lagi');
      retry.addEventListener('click', () => setHouse(houseId));
      notice.replaceChildren(document.createTextNode('Galeri belum termuat. '), retry);
      notice.hidden = false;
      return false;
    }
  }

  function fillInformation(record) {
    const entry = record.entry;
    category.textContent = `${entry.category} · ${entry.culture}`;
    title.textContent = entry.title;
    description.textContent = entry.summary;
    summary.setAttribute('aria-label', `${entry.title}. ${entry.summary} Baca cerita lengkap`);
    detailCategory.textContent = category.textContent;
    detailTitle.textContent = entry.title;
    detailBody.replaceChildren(...entry.details.map((paragraph) => element('p', '', paragraph)));
    const sourceHeading = element('h4', '', 'Sumber cerita');
    const sources = element('ul', 'sci-gallery-sources');
    for (const source of entry.sources) {
      const item = element('li');
      item.append(link(source.title, source.url));
      sources.append(item);
    }
    const credit = element('div', 'sci-gallery-credit');
    credit.append(element('h4', '', 'Kredit gambar'));
    credit.append(element('p', '', entry.credit.author));
    const permissions = element('p');
    permissions.append(link('Sumber gambar', entry.credit.url), document.createTextNode(' · '),
      link(entry.credit.license, entry.credit.licenseUrl || entry.credit.url));
    credit.append(permissions, element('p', '', entry.credit.changes));
    detailBody.append(sourceHeading, sources, credit);
  }

  function focusedPose(record) {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const card = summary.getBoundingClientRect();
    const topSpace = Math.max(76, back.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 18);
    const bottomSpace = Math.max(144, height - (card.top - stage.getBoundingClientRect().top) + 20);
    const available = Math.max(80, height - topSpace - bottomSpace);
    const tangent = Math.tan(camera.fov * Math.PI / 360);
    const distance = Math.min(MAX_FOCUS_DISTANCE, Math.max(
      record.height / (2 * tangent * available / height),
      record.width / (2 * tangent * camera.aspect * Math.min(0.9, (width - 36) / width)),
    ) * 1.03);
    const offsetY = (bottomSpace - topSpace) / height * distance * tangent;
    const position = record.center.clone().addScaledVector(record.normal, distance);
    position.y -= offsetY;
    lookTarget.copy(record.center);
    lookTarget.y -= offsetY;
    // Reuse the camera's lookAt implementation to derive the desired quaternion,
    // then restore it immediately before starting the interpolation.
    const oldPosition = camera.position.clone();
    const oldRotation = camera.quaternion.clone();
    camera.position.copy(position);
    camera.lookAt(lookTarget);
    const quaternion = camera.quaternion.clone();
    camera.position.copy(oldPosition);
    camera.quaternion.copy(oldRotation);
    return { position, quaternion };
  }

  function tweenTo(pose, returning = false) {
    transition = {
      start: performance.now(), duration: reducedMotion.matches ? 0 : FOCUS_DURATION,
      fromPosition: camera.position.clone(), fromQuaternion: camera.quaternion.clone(),
      toPosition: pose.position, toQuaternion: pose.quaternion, returning,
    };
  }

  function focusFrame(record) {
    if (!active || selected || transition || status !== 'ready') return false;
    selected = record;
    savedPose = { position: camera.position.clone(), quaternion: camera.quaternion.clone() };
    previousFocus = document.activeElement;
    fillInformation(record);
    focus.hidden = false;
    root.classList.add('is-gallery-focus');
    root.dataset.gallerySelected = record.entry.id;
    stage.setAttribute('aria-label', record.entry.alt);
    onLock?.(true);
    for (const item of records) item.marker.hidden = true;
    tweenTo(focusedPose(record));
    back.focus({ preventScroll: true });
    return true;
  }

  function openDetails() {
    if (!selected || transition?.returning) return;
    details.hidden = false;
    summary.setAttribute('aria-expanded', 'true');
    focus.inert = true;
    const top = root.querySelector('.sci-top');
    if (top) top.inert = true;
    detailBack.focus({ preventScroll: true });
  }

  function closeDetails(restoreFocus = true) {
    if (details.hidden) return false;
    details.hidden = true;
    summary.setAttribute('aria-expanded', 'false');
    focus.inert = false;
    const top = root.querySelector('.sci-top');
    if (top) top.inert = false;
    if (restoreFocus) summary.focus({ preventScroll: true });
    return true;
  }

  function endFocus(restoreFocus = true) {
    closeDetails(false);
    selected = null;
    transition = null;
    savedPose = null;
    focus.hidden = true;
    root.classList.remove('is-gallery-focus');
    delete root.dataset.gallerySelected;
    if (originalStageLabel === null) stage.removeAttribute('aria-label');
    else stage.setAttribute('aria-label', originalStageLabel);
    onLock?.(false);
    if (restoreFocus) {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.hidden) {
        previousFocus.focus({ preventScroll: true });
      } else root.focus({ preventScroll: true });
    }
    previousFocus = null;
  }

  function closeFocus() {
    if (!selected || !savedPose) return false;
    closeDetails(false);
    if (!transition?.returning) tweenTo(savedPose, true);
    return true;
  }

  function update(now) {
    if (!active || destroyed) return;
    if (transition) {
      const progress = transition.duration ? Math.max(0, Math.min(1, (now - transition.start) / transition.duration)) : 1;
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
      camera.quaternion.slerpQuaternions(transition.fromQuaternion, transition.toQuaternion, eased);
      if (progress >= 1) {
        const returning = transition.returning;
        transition = null;
        if (returning) endFocus();
      }
    }
    camera.updateMatrixWorld(true);
    if (selected) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const ready = root.classList.contains('is-ready') && status === 'ready';
    camera.getWorldDirection(forward);
    let bestAlignment = -1;
    let previousAlignment = -1;
    let best = null;
    for (const record of records) {
      direction.subVectors(record.center, camera.position);
      const distance = direction.length();
      const alignment = distance ? direction.dot(forward) / distance : -1;
      projected.copy(record.center);
      projected.y += record.height / 2 + 0.22;
      projected.project(camera);
      const visible = ready && distance < 18 && alignment > 0.88
        && direction.dot(record.normal) < -0.1
        && projected.z > -1 && projected.z < 1
        && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.91;
      if (!visible) continue;
      record.marker.style.left = `${(projected.x + 1) * width / 2}px`;
      record.marker.style.top = `${(1 - projected.y) * height / 2}px`;
      if (record === gazed) previousAlignment = alignment;
      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        best = record;
      }
    }
    // Keep the current target through small aim changes, avoiding flicker at
    // the boundary between two paintings. Only the closest aim gets a marker.
    if (gazed && previousAlignment >= bestAlignment - 0.015 && previousAlignment > 0) best = gazed;
    gazed = best;
    for (const record of records) record.marker.hidden = record !== gazed;
  }

  function pick(clientX, clientY) {
    if (!active || selected || transition || status !== 'ready' || !root.classList.contains('is-ready')) return false;
    const rect = stage.getBoundingClientRect();
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(records.map((record) => record.hit), false);
    return hits.length ? focusFrame(hits[0].object.userData.galleryRecord) : false;
  }

  function handleKey(event) {
    if (!active) return false;
    if (event.code === 'Escape') {
      if (closeDetails()) return true;
      return closeFocus();
    }
    if (!details.hidden && event.code === 'Tab') {
      const buttons = [...sheet.querySelectorAll(FOCUSABLE)].filter((node) => !node.hidden);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
        last?.focus();
        return true;
      }
      if (!event.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) {
        first?.focus();
        return true;
      }
    }
    if (event.code === 'KeyE' && !event.repeat && !selected && gazed) return focusFrame(gazed);
    return false;
  }

  function resize() {
    if (!selected || transition?.returning) return;
    const pose = focusedPose(selected);
    camera.position.copy(pose.position);
    camera.quaternion.copy(pose.quaternion);
    transition = null;
  }

  function hide() {
    active = false;
    generation++;
    if (savedPose) {
      camera.position.copy(savedPose.position);
      camera.quaternion.copy(savedPose.quaternion);
    }
    endFocus(false);
    notice.hidden = true;
    group.visible = false;
    for (const record of records) record.marker.hidden = true;
    gazed = null;
  }

  back.addEventListener('click', closeFocus);
  summary.addEventListener('click', openDetails);
  detailBack.addEventListener('click', () => closeDetails());
  details.addEventListener('click', (event) => {
    if (event.target === details) closeDetails();
  });

  return {
    setHouse, update, pick, handleKey, resize, hide, closeFocus,
    get locked() { return Boolean(selected || transition); },
    get controlsCamera() { return Boolean(selected || transition); },
    get state() { return { status, houseId, selectedId: selected?.entry.id || null, count: records.length }; },
    destroy() {
      if (destroyed) return;
      hide();
      destroyed = true;
      clearFrames();
      scene.remove(group);
      disposeFrame(frameModel);
      frameModel = null;
      for (const promise of images.values()) promise.then(({ texture }) => texture.dispose()).catch(() => {});
      images.clear();
      plane.dispose();
      backingMaterial.dispose();
      hitMaterial.dispose();
      markers.remove();
      notice.remove();
      focus.remove();
      details.remove();
      delete root.dataset.galleryStatus;
    },
  };
}
