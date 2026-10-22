import { aS as Vector3, bm as Quaternion } from './vendor.75f6e6ae65453426.js';

const AUDIO_URL = '/audio/lulo.m4a';
const PREFIX = 'NPC_SultraLulo_';
const BONE_PREFIX = 'Chara_Low_RigGameSkeleton';
const COLORS = [22, 23, 25, 19, 21, 24];
const UP = new Vector3(0, 1, 0);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function stageSettings(layout) {
  return {
    x: -30, z: -7, radius: 2.5, count: 12,
    ...layout.stage?.dance,
  };
}

/** Register ordinary native citizens: their original mesh, joints and clips stay intact. */
export function registerLuloDancers(game, layout) {
  const stage = stageSettings(layout);
  const actors = {};
  for (let index = 0; index < stage.count; index++) {
    const angle = index * Math.PI * 2 / stage.count;
    const x = stage.x + Math.sin(angle) * stage.radius;
    const z = stage.z + Math.cos(angle) * stage.radius;
    const rotation = angle + Math.PI;
    const uid = `${PREFIX}${index}`;
    const subtype = `SultraLulo_${index}`;
    game.app.$characters.npcs[subtype] = {
      gradientID: COLORS[index % COLORS.length], face: index % 2,
      head: null, body: null, bottom: 'Bottom-Sandals',
      script: 'PassiveCitizen', scriptArgs: { animation: 'Dancing' },
    };
    actors[uid] = {
      uid, type: 'NPC', params: { subtype },
      transforms: [x, layout.groundY ?? 3, z, 1, 1, 1,
        0, Math.sin(rotation / 2), 0, Math.cos(rotation / 2)],
    };
  }
  return actors;
}

function armChain(actor, side) {
  const bones = actor.skeleton?.bones;
  if (!bones) return null;
  const find = (name) => bones.find((bone) => bone.name === `${BONE_PREFIX}${name}_${side}`);
  const shoulder = find('Shoulder'), elbow = find('Elbow'), wrist = find('Wrist');
  return shoulder && elbow && wrist ? { shoulder, elbow, wrist } : null;
}

// Rotate a joint in world space, then transform the result back to its parent.
// Bone translations, lengths, weights and the shared animation clips are untouched.
function createDanceScratch() {
  return {
    origin: new Vector3(), elbow: new Vector3(), wrist: new Vector3(),
    direction: new Vector3(), hand: new Vector3(), bendAxis: new Vector3(), targetElbow: new Vector3(),
    aimOrigin: new Vector3(), current: new Vector3(), desired: new Vector3(),
    delta: new Quaternion(), rotation: new Quaternion(), parentRotation: new Quaternion(),
    matrixPosition: new Vector3(), matrixScale: new Vector3(),
    inward: new Vector3(), leftShoulder: new Vector3(), target: new Vector3(), shoulder: new Vector3(),
  };
}

function aimBone(bone, child, destination, scratch) {
  // The actor was updated once before solving, and each joint update propagates
  // to its children. Reading these matrices avoids updating every ancestor for
  // every getWorldPosition/getWorldQuaternion call in the two-arm solver.
  const origin = scratch.aimOrigin.setFromMatrixPosition(bone.matrixWorld);
  const current = scratch.current.setFromMatrixPosition(child.matrixWorld).sub(origin);
  const desired = scratch.desired.copy(destination).sub(origin);
  if (current.lengthSq() < 1e-8 || desired.lengthSq() < 1e-8) return;
  const delta = scratch.delta.setFromUnitVectors(current.normalize(), desired.normalize());
  const rotation = scratch.rotation;
  bone.matrixWorld.decompose(scratch.matrixPosition, rotation, scratch.matrixScale);
  rotation.premultiply(delta);
  if (bone.parent) {
    bone.parent.matrixWorld.decompose(scratch.matrixPosition, scratch.parentRotation, scratch.matrixScale);
    rotation.premultiply(scratch.parentRotation.invert());
  }
  bone.quaternion.copy(rotation);
  bone.updateMatrixWorld(true);
}

function reachHand(chain, destination, inward, scratch) {
  const { shoulder, elbow, wrist } = chain;
  const origin = scratch.origin.setFromMatrixPosition(shoulder.matrixWorld);
  const elbowNow = scratch.elbow.setFromMatrixPosition(elbow.matrixWorld);
  const wristNow = scratch.wrist.setFromMatrixPosition(wrist.matrixWorld);
  const upper = origin.distanceTo(elbowNow), lower = elbowNow.distanceTo(wristNow);
  if (upper < .01 || lower < .01) return;
  const direction = scratch.direction.copy(destination).sub(origin);
  const distance = clamp(direction.length(), Math.abs(upper - lower) + .005, (upper + lower) * .98);
  direction.normalize();
  const hand = scratch.hand.copy(origin).addScaledVector(direction, distance);
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  // Relaxed elbows sit below the hand line and slightly toward the circle.
  const bendAxis = scratch.bendAxis.copy(inward).multiplyScalar(.3).addScaledVector(UP, -1);
  bendAxis.addScaledVector(direction, -bendAxis.dot(direction)).normalize();
  const targetElbow = scratch.targetElbow.copy(origin).addScaledVector(direction, along).addScaledVector(bendAxis, bend);
  aimBone(shoulder, elbow, targetElbow, scratch);
  aimBone(elbow, wrist, hand, scratch);
}

function updateDancers(game, state, scene) {
  const stage = state.stage;
  const clock = state.element && !state.element.paused
    ? state.element.currentTime : (game.time?.elapsed ?? 0) / 1000;
  const sway = Math.sin(clock * Math.PI * 2 / 1.06) * .035;
  const actors = state.actorSlots;
  const scratch = state.scratch;
  let count = 0;
  for (let index = 0; index < stage.count; index++) {
    const actor = scene.actors?.[state.actorIds[index]];
    actors[index] = null;
    if (!actor?.isBodyReady || !actor.skeleton || !actor.animationMixer) continue;
    let dancer = state.dancers.get(actor);
    if (!dancer) {
      dancer = { actor, left: armChain(actor, 'L'), right: armChain(actor, 'R') };
      state.dancers.set(actor, dancer);
      actor.canLookPlayer = false;
    }
    // All feet follow the same existing joint animation. A small shared sideways
    // step keeps the ring together; the underlying collision centres stay stable.
    const action = actor.allAnims?.Dancing;
    if (action && actor.charMesh?.visible) {
      action.time = clock % action.getClip().duration;
      actor.animationMixer.update(0);
    }
    const angle = index * Math.PI * 2 / stage.count + sway;
    actor.base.position.x = stage.x + Math.sin(angle) * stage.radius;
    actor.base.position.z = stage.z + Math.cos(angle) * stage.radius;
    // The native upright conversion can leave X/Z Euler rotations at PI.
    // Assigning only rotation.y folds half the circle toward the same side.
    // A complete yaw quaternion keeps every dancer facing the ring centre.
    actor.base.quaternion.setFromAxisAngle(UP, angle + Math.PI);
    actor.baseQuaternion.copy(actor.base.quaternion);
    if (actor.charMesh?.visible) actor.base.updateMatrixWorld(true);
    actors[index] = dancer;
    count++;
  }
  for (let index = 0; index < stage.count; index++) {
    const dancer = actors[index];
    if (!dancer) continue;
    const { actor } = dancer;
    if (!actor.charMesh?.visible || !dancer.left || !dancer.right) continue;
    const previous = actors[(index + stage.count - 1) % stage.count]?.actor;
    const next = actors[(index + 1) % stage.count]?.actor;
    if (!previous || !next) continue;
    const inward = scratch.inward.set(stage.x - actor.base.position.x, 0, stage.z - actor.base.position.z).normalize();
    const leftShoulder = scratch.leftShoulder.setFromMatrixPosition(dancer.left.shoulder.matrixWorld);
    const leftNeighbor = leftShoulder.distanceToSquared(previous.base.position)
      < leftShoulder.distanceToSquared(next.base.position) ? previous : next;
    for (let side = 0; side < 2; side++) {
      const chain = side === 0 ? dancer.left : dancer.right;
      const neighbor = side === 0 ? leftNeighbor : leftNeighbor === previous ? next : previous;
      const target = scratch.target.copy(actor.base.position).add(neighbor.base.position).multiplyScalar(.5);
      target.y = scratch.shoulder.setFromMatrixPosition(chain.shoulder.matrixWorld).y - .16 + sway;
      reachHand(chain, target, inward, scratch);
    }
  }
  state.dancerCount = count;
}

export function installSultraLulo(game, layout) {
  if (game.sultraLulo) return game.sultraLulo;
  const state = game.sultraLulo = {
    stage: stageSettings(layout), dancers: new Map(), dancerCount: 0,
    element: null, volume: 0, targetVolume: 0, distance: Infinity,
    loading: false, blocked: false, disposed: false, error: null,
  };
  state.actorSlots = new Array(state.stage.count).fill(null);
  state.actorIds = Array.from({ length: state.stage.count }, (_, index) => `${PREFIX}${index}`);
  state.scratch = createDanceScratch();
  const speaker = layout.stage?.speakers || { x: -30, z: -16 };
  let lastUpdate = performance.now(), lastAttempt = -Infinity, playPending = false;
  let mediaSource = null, bgmSuspended = false;

  function getElement() {
    if (state.element) return state.element;
    const element = new Audio();
    element.preload = 'none';
    element.loop = true;
    element.volume = 0;
    element.src = AUDIO_URL;
    element.addEventListener('error', () => { state.error = element.error?.message || 'Lulo audio unavailable'; });
    element.addEventListener('playing', () => { state.loading = false; state.blocked = false; });
    state.element = element;
    return element;
  }

  function connectMasterBus() {
    if (mediaSource || !state.element) return;
    const context = game.audio?.getContext?.();
    const input = game.audio?.getInput?.();
    if (!context || !input) return;
    mediaSource = context.createMediaElementSource(state.element);
    mediaSource.connect(input);
  }

  function tryPlay(userGesture = false) {
    if (state.disposed || state.targetVolume <= .001 || document.hidden || state.error) return;
    if (!userGesture && !game.audio?.unlocked?.value) return;
    const element = getElement();
    connectMasterBus();
    if (!element.paused || playPending || (!userGesture && performance.now() - lastAttempt < 2000)) return;
    lastAttempt = performance.now();
    playPending = true;
    state.loading = true;
    element.play().then(() => { state.blocked = false; }).catch((error) => {
      // Autoplay is retried on the next real input; it never blocks exploration.
      if (error.name === 'NotAllowedError') state.blocked = true;
      else if (error.name !== 'AbortError') state.error = error.message;
    }).finally(() => { playPending = false; state.loading = false; });
  }

  function updateAudio() {
    if (state.disposed) return;
    const now = performance.now(), dt = Math.min(.2, (now - lastUpdate) / 1000);
    lastUpdate = now;
    const scene = game.scenes?.current;
    const position = scene?.player?.base?.position;
    const active = scene?.id === 'IslandWest' && position && !document.hidden;
    state.distance = active ? Math.hypot(position.x - speaker.x, position.z - speaker.z) : Infinity;
    const falloff = clamp((28 - state.distance) / 21, 0, 1);
    const muted = !!(game.app?.$store?.isAudioMuted || game.app?.$store?.isVideoPlaying);
    state.targetVolume = active && !muted ? .72 * falloff * falloff * (3 - 2 * falloff) : 0;
    state.volume += (state.targetVolume - state.volume) * (1 - Math.exp(-dt * 5));
    if (!active || muted) state.volume = 0;
    if (state.volume < .001 && state.targetVolume === 0) state.volume = 0;
    if (state.element) {
      // Native master bus applies its own smooth mute and background-tab policy.
      state.element.volume = clamp(state.volume, 0, 1);
      if (state.volume === 0) state.element.pause();
    }
    if (state.targetVolume > .001) tryPlay();
    if (active && state.distance < 12) state.watchTime = (state.watchTime || 0) + dt;
    else state.watchTime = 0;
    if (state.watchTime > 3) {
      const vars = game.savestate?.game?.vars;
      if (vars && !vars.isSultraLuloWatched) vars.isSultraLuloWatched = true;
    }
    const suspend = state.volume > .06 && state.element && !state.element.paused;
    if (!!suspend !== bgmSuspended) {
      bgmSuspended = !!suspend;
      game.audio?.bgm?.suspend(bgmSuspended);
    }
  }

  function onInput() { updateAudio(); tryPlay(true); }
  function onRender() {
    if (state.disposed) return;
    const scene = game.scenes?.current;
    if (scene !== state.scene) {
      state.scene = scene;
      state.dancers.clear();
      state.actorSlots.fill(null);
      state.dancerCount = 0;
    }
    if (scene?.id === 'IslandWest') updateDancers(game, state, scene);
    updateAudio();
  }
  game.hooks.beforeRender.watch(onRender);
  window.addEventListener('pointerdown', onInput, { passive: true });
  window.addEventListener('keydown', onInput);
  document.addEventListener('visibilitychange', updateAudio);
  // The phone pauses rendering. Keep mute/scene changes responsive while it is open.
  const interval = window.setInterval(updateAudio, 250);
  state.update = onRender;
  state.destroy = () => {
    state.disposed = true;
    window.clearInterval(interval);
    game.hooks.beforeRender.unwatch?.(onRender);
    window.removeEventListener('pointerdown', onInput);
    window.removeEventListener('keydown', onInput);
    document.removeEventListener('visibilitychange', updateAudio);
    state.element?.pause();
    if (state.element) { state.element.removeAttribute('src'); state.element.load(); }
    mediaSource?.disconnect();
    if (bgmSuspended) game.audio?.bgm?.suspend(false);
    state.dancers.clear();
    state.actorSlots.fill(null);
    if (game.sultraLulo === state) delete game.sultraLulo;
  };
  return state;
}
