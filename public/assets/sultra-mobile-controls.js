const MAIN_SCENE = 'IslandWest';
const ORBIT_SPEED = 0.0055;
const ELEVATION_SPEED = 0.006;
const DRAG_THRESHOLD = 5;

export function installSultraMobileControls(game) {
  if (game.sultraMobileControls) return;
  const state = game.sultraMobileControls = {
    enabled: false, dragging: false, blocked: false, player: null, touch: null, game,
  };
  const coarse = window.matchMedia?.('(pointer: coarse)');
  const mobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  function enabled() {
    const type = game.app?.$device?.type;
    return Boolean(type?.mobile || type?.tablet || mobileAgent
      || (coarse?.matches && Math.min(window.innerWidth, window.innerHeight) <= 1024));
  }

  function splitY() {
    const rect = game.options?.canvas?.getBoundingClientRect?.();
    return rect?.height ? rect.top + rect.height / 2 : window.innerHeight / 2;
  }

  function mainScene() {
    const scene = game.scenes?.current;
    return scene?.id === MAIN_SCENE ? scene : null;
  }

  function orbit(dx, dy) {
    const scene = mainScene();
    if (!scene || game.store?.inDialog?.value || game.store?.isTransitionActive?.value) return;
    scene.physics?.send?.('orbit-camera', { dx, dy }, true);
  }

  function patchPlayer(player) {
    if (player.__sultraMobileMap) return;
    const updateJoystick = player.updateJoystick;
    if (typeof updateJoystick !== 'function') return;
    player.__sultraMobileMap = true;
    player.updateJoystick = function () {
      const touch = this.webgl?.input?.touch?.value;
      if (enabled() && touch?.pressed && touch.useTouch && touch.firstPos
        && touch.firstPos.y < splitY()) {
        state.blocked = true;
        return this.updateImmobile();
      }
      state.blocked = false;
      return updateJoystick.call(this);
    };
  }

  function onTouchStart(event) {
    if (state.touch || !enabled() || event.target?.tagName !== 'CANVAS') return;
    for (const touch of event.changedTouches) {
      if (touch.clientY >= splitY()) continue;
      state.touch = {
        id: touch.identifier, x: touch.clientX, y: touch.clientY,
        startX: touch.clientX, startY: touch.clientY,
      };
      state.dragging = false;
      return;
    }
  }

  function onTouchMove(event) {
    const drag = state.touch;
    if (!drag) return;
    let point = null;
    for (const touch of event.changedTouches) {
      if (touch.identifier === drag.id) point = touch;
    }
    if (!point) return;
    if (!state.dragging) {
      if (Math.hypot(point.clientX - drag.startX, point.clientY - drag.startY) < DRAG_THRESHOLD) return;
      state.dragging = true;
    }
    const dx = point.clientX - drag.x;
    const dy = point.clientY - drag.y;
    drag.x = point.clientX;
    drag.y = point.clientY;
    if (dx || dy) orbit(dx * ORBIT_SPEED, dy * ELEVATION_SPEED);
  }

  function onTouchEnd(event) {
    const drag = state.touch;
    if (!drag) return;
    for (const touch of event.changedTouches) {
      if (touch.identifier !== drag.id) continue;
      state.touch = null;
      state.dragging = false;
      return;
    }
  }

  game.hooks.beforeRender.watch(() => {
    state.enabled = enabled();
    const player = mainScene()?.player;
    if (!player) return;
    if (player !== state.player) state.player = player;
    patchPlayer(player);
  });

  window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
  window.__sultraMobileControls = state;
}
