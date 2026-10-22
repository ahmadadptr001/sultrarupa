import {
  cV as Raycaster, aT as Vector2, aS as Vector3, cx as Box3,
  b5 as Mesh, a$ as MeshBasicMaterial, b0 as DoubleSide,
} from './vendor.75f6e6ae65453426.js';

const APPROACH_DISTANCE = 5;
const NO_RAYCAST = () => {};

// Use the existing renderer and house geometry. Only the nearby house receives
// a soft additive wash; photographs, textures and the distant skyline stay intact.
export function createHouseInteractions(game, ui, interior) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const prompt = document.createElement('div');
  prompt.className = 'sc-house-prompt';
  prompt.hidden = true;
  prompt.setAttribute('role', 'status');
  const key = document.createElement('kbd');
  key.textContent = 'Space';
  const copy = document.createElement('span');
  copy.className = 'sc-house-prompt-copy';
  const title = document.createElement('strong');
  title.textContent = 'Masuk rumah';
  const hint = document.createElement('span');
  hint.className = 'sc-house-prompt-hint';
  hint.textContent = 'Bisa juga klik rumah';
  copy.append(title, hint);
  const touch = document.createElement('span');
  touch.className = 'sc-house-prompt-touch';
  touch.textContent = 'Ketuk rumah untuk masuk';
  prompt.append(key, copy, touch);
  document.body.append(prompt);

  let entries = [];
  let nearest = null;
  let scene = null;
  let camera = null;
  let pointerStart = null;
  let suppressedKey = '';
  let lastUpdate = performance.now();
  let focusedId = null;
  let focusedScene = null;

  function clearFocus() {
    focusedScene?.playerCam?.removeTarget({ id: 'sultra-house', posEase: .08, lookAtEase: .08 });
    focusedScene = null;
    focusedId = null;
    suppressedKey = '';
  }

  function focus(id) {
    if (focusedId === id && focusedScene === scene) return;
    const entry = entries.find((item) => item.id === id);
    if (!entry || !scene?.playerCam || !camera) return;
    const center = entry.bounds.getCenter(new Vector3());
    const size = entry.bounds.getSize(new Vector3());
    const direction = camera.getWorldPosition(new Vector3()).sub(center);
    direction.y = 0;
    if (direction.lengthSq() < .01) direction.set(0, 0, 1);
    direction.normalize();
    const halfFov = camera.fov * Math.PI / 360;
    const distance = Math.max(size.y / (2 * Math.tan(halfFov) * .42),
      Math.max(size.x, size.z) / (2 * Math.tan(halfFov) * camera.aspect * .78))
      + Math.max(size.x, size.z) * .35;
    const position = center.clone().addScaledVector(direction, distance);
    position.y += distance * .15;
    const lookAt = center.clone();
    // Frame the whole building in the space above the conversation card.
    lookAt.y -= distance * Math.tan(halfFov) * .60;
    focusedId = id;
    focusedScene = scene;
    scene.playerCam.setTarget({ id: 'sultra-house', position, lookAt,
      lockPlayer: true, posEase: .08, lookAtEase: .08 });
  }

  function available() {
    return scene?.id === 'IslandWest' && scene === game.scenes.current
      && scene.player?.canMove && !ui.isOpen && !interior?.isOpen
      && !game.store.onPhone?.value && !game.store.inDialog?.value;
  }

  function hasNativeInteraction() {
    return Boolean(game.store.interactionButton?.value);
  }

  function clear() {
    clearFocus();
    for (const entry of entries) {
      entry.glows.forEach((glow) => glow.removeFromParent());
      entry.material.dispose();
    }
    entries = [];
    nearest = null;
    scene = camera = null;
    pointerStart = null;
    prompt.hidden = true;
  }

  function setHouses(houses) {
    clear();
    entries = houses.map(({ id, object }) => {
      object.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(object);
      const meshes = [];
      object.traverse((node) => {
        if (node.isMesh && node.visible && !node.userData.sultraHouseGlow) meshes.push(node);
      });
      const material = new MeshBasicMaterial({
        color: 0xffdd91, transparent: true, opacity: 0,
        blending: 2, // Three.js AdditiveBlending.
        side: DoubleSide, depthTest: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
        toneMapped: false, fog: true,
      });
      const glows = meshes.map((mesh) => {
        const glow = new Mesh(mesh.geometry, material);
        glow.name = 'Nearby house glow';
        glow.userData.sultraHouseGlow = true;
        glow.raycast = NO_RAYCAST;
        glow.layers.mask = mesh.layers.mask;
        glow.visible = false;
        glow.renderOrder = mesh.renderOrder + 1;
        mesh.add(glow);
        return glow;
      });
      return { id, bounds, meshes, glows, material };
    });
  }

  function openHouse(entry) {
    if (!entry || !available()) return false;
    game.input?.keyboard?.unpressAllKeys();
    if (interior?.open(entry)) return true;
    return ui.openTarget(entry.id, { presentation: 'house-dialog' });
  }

  function onKeyDown(event) {
    if (event.code !== 'Space' || event.repeat
      || event.altKey || event.ctrlKey || event.metaKey
      || event.target.closest?.('input, textarea, button, a, [contenteditable="true"]')
      || !nearest || !available() || hasNativeInteraction()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressedKey = event.code;
    openHouse(nearest);
  }

  function onKeyUp(event) {
    if (event.code !== suppressedKey) return;
    event.stopImmediatePropagation();
    suppressedKey = '';
  }

  function onPointerDown(event) {
    pointerStart = null;
    if (!event.isPrimary || event.button !== 0 || event.target.tagName !== 'CANVAS' || !available()) return;
    const entry = hitHouse(event);
    if (entry) pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY, entry, dragged: false };
  }

  function hitHouse(event) {
    if (!camera) return null;
    const canvas = game.options?.canvas || event.target;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    // Native chat bubbles are 3D meshes, so a house behind one must not steal
    // its click before the engine processes the selected conversation.
    if (game.store.interactionButton?.value?.icon === 'interactions-chat'
      && raycaster.intersectObjects(scene.raycastableBubble?.raycastables || [], false).length) return null;
    const hits = raycaster.intersectObjects(entries.flatMap((entry) => entry.meshes), false);
    const hit = hits.find(({ object }) => object.visible);
    const entry = hit && entries.find((candidate) => candidate.meshes.includes(hit.object));
    return entry || null;
  }

  function onPointerMove(event) {
    if (pointerStart?.id === event.pointerId
      && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) pointerStart.dragged = true;
  }

  function onPointerUp(event) {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.id !== event.pointerId || start.dragged
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    // Let native mouseup/touchend release movement first. Pointer events also
    // work where the game's touch preventDefault suppresses synthetic clicks.
    setTimeout(() => { if (entries.includes(start.entry)) openHouse(start.entry); }, 0);
  }

  function onPointerCancel() {
    pointerStart = null;
  }

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);

  return {
    setHouses,
    focus,
    clearFocus,
    get activeId() { return nearest?.id ?? null; },
    update(nextScene, nextCamera, player) {
      scene = nextScene;
      camera = nextCamera;
      const now = performance.now();
      const blend = 1 - Math.exp(-Math.min((now - lastUpdate) / 1000, .1) * 10);
      lastUpdate = now;
      nearest = null;
      let distance = APPROACH_DISTANCE;
      if (available()) {
        for (const entry of entries) {
          const { min, max } = entry.bounds;
          const dx = Math.max(min.x - player.x, 0, player.x - max.x);
          const dz = Math.max(min.z - player.z, 0, player.z - max.z);
          const gap = Math.hypot(dx, dz);
          if (gap < distance) { nearest = entry; distance = gap; }
        }
      }
      for (const entry of entries) {
        const opacity = entry.id === focusedId ? .2 : entry === nearest ? .3 : 0;
        entry.material.opacity += (opacity - entry.material.opacity) * blend;
        entry.glows.forEach((glow) => { glow.visible = entry.material.opacity > .002; });
      }
      prompt.hidden = !nearest || !available() || hasNativeInteraction();
    },
    clear,
    destroy() {
      clear();
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      prompt.remove();
    },
  };
}
