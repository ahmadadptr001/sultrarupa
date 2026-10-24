import { aS as Vector3, bm as Quaternion } from './vendor.75f6e6ae65453426.js';

const AUDIO_URL = '/audio/lulo.m4a';
const PREFIX = 'NPC_SultraLulo_';
const BONE_PREFIX = 'Chara_Low_RigGameSkeleton';
const COLORS = [22, 23, 25, 19, 21, 24];
const UP = new Vector3(0, 1, 0);
const BEAT = .53;
const AUDIENCE_COUNT = 8;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
// Lulo Leba: two small steps right, four left, with a low joined-hand pulse.
// Reference: Sihartin, Pola Pelatihan Gerak Tari Lulo, SDN 37 Kendari.
function ringStep(time) {
  const beat = Math.max(0, time) / BEAT, cycle = Math.floor(beat / 6);
  const offsets = [0, -1, -2, -1, 0, 1, 2];
  const index = Math.floor(beat) % 6;
  return (cycle * 2 + offsets[index] + (offsets[index + 1] - offsets[index]) * smooth(beat % 1)) * .10;
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function stageSettings(layout) {
  const dance = layout.stage?.dance || {};
  return { x: -30, z: -7, ...dance,
    radius: (dance.radius || 2.5) * 1.3, count: 16,
  };
}

/** Register ordinary native citizens: their original mesh, joints and clips stay intact. */
export function registerLuloDancers(game, layout) {
  const stage = stageSettings(layout);
  const actors = {};
  for (let index = 0; index < stage.count + AUDIENCE_COUNT; index++) {
    const watching = index >= stage.count;
    const angle = watching ? (index - stage.count) * Math.PI * 2 / AUDIENCE_COUNT + .18 : index * Math.PI * 2 / stage.count;
    const radius = watching ? stage.radius + 2.6 + (index % 2) * .45 : stage.radius;
    const x = stage.x + Math.sin(angle) * radius;
    const z = stage.z + Math.cos(angle) * radius;
    const rotation = angle + Math.PI;
    const uid = `${PREFIX}${index}`;
    const subtype = `SultraLulo_${index}`;
    game.app.$characters.npcs[subtype] = {
      gradientID: COLORS[index % COLORS.length], face: index % 2,
      head: null, body: null, bottom: 'Bottom-Sandals',
      script: 'PassiveCitizen', scriptArgs: { animation: watching ? (index % 3 === 0 ? 'Happy' : 'Idle') : 'Idle' },
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
    startUpper: new Quaternion(), startLower: new Quaternion(),
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

function reachHand(chain, destination, inward, scratch, leg = false, weight = 1) {
  const { shoulder, elbow, wrist } = chain;
  scratch.startUpper.copy(shoulder.quaternion);
  scratch.startLower.copy(elbow.quaternion);
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
  const bendAxis = scratch.bendAxis.copy(inward).multiplyScalar(leg ? 1 : .3).addScaledVector(UP, leg ? 0 : -1);
  bendAxis.addScaledVector(direction, -bendAxis.dot(direction)).normalize();
  const targetElbow = scratch.targetElbow.copy(origin).addScaledVector(direction, along).addScaledVector(bendAxis, bend);
  aimBone(shoulder, elbow, targetElbow, scratch);
  aimBone(elbow, wrist, hand, scratch);
  if (weight < 1) {
    shoulder.quaternion.slerpQuaternions(scratch.startUpper, shoulder.quaternion, weight);
    elbow.quaternion.slerpQuaternions(scratch.startLower, elbow.quaternion, weight);
    shoulder.updateMatrixWorld(true);
  }
}

function legChain(actor, side) {
  const find = name => actor.skeleton.bones.find(b => b.name === BONE_PREFIX + name + '_' + side);
  const hip = find('Hip'), knee = find('Knee'), ankle = find('Ankle');
  return hip && knee && ankle ? { shoulder: hip, elbow: knee, wrist: ankle } : null;
}

function sampleClip(actor, name, time, fade = 0) {
  const action = actor.allAnims?.[name] || actor.allAnims?.Idle;
  if (!action) return;
  let playback = actor.__luloPlayback;
  if (!playback) {
    playback = actor.__luloPlayback = { action: null, started: 0,
      poses: actor.skeleton.bones.map(bone => ({ bone, lastQ: bone.quaternion.clone(), lastP: bone.position.clone(),
        fromQ: bone.quaternion.clone(), fromP: bone.position.clone() })) };
  }
  if (playback.action !== action) {
    for (const pose of playback.poses) { pose.fromQ.copy(pose.lastQ); pose.fromP.copy(pose.lastP); }
    playback.action = action;
    playback.started = performance.now();
  }
  // PassiveCitizen restores its idle weights every native update. Explicitly
  // sample the requested clip after that update so Walk cannot be muted by Idle.
  actor.animationMixer.stopAllAction();
  action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
  action.time = time % action.getClip().duration;
  actor.animationMixer.update(0);
  actor.__luloAction = action;
  const blend = fade ? smooth((performance.now() - playback.started) / (fade * 1000)) : 1;
  for (const pose of playback.poses) {
    if (blend < 1) {
      pose.bone.quaternion.slerpQuaternions(pose.fromQ, pose.bone.quaternion, blend);
      pose.bone.position.lerpVectors(pose.fromP, pose.bone.position, blend);
    }
    pose.lastQ.copy(pose.bone.quaternion);
    pose.lastP.copy(pose.bone.position);
  }
}

function updateDancers(game, state, scene) {
  const stage = state.stage, actors = state.actorSlots, scratch = state.scratch;
  const time = state.motionTime;
  const beat = time / BEAT, step = Math.floor(beat), fraction = beat % 1;
  const pulse = Math.sin(fraction * Math.PI);
  const orbit = ringStep(time) / stage.radius;
  let count = 0, watching = 0, moving = 0;
  actors.fill(null);
  for (let index = 0; index < state.actorIds.length; index++) {
    const actor = scene.actors?.[state.actorIds[index]];
    if (!actor?.isBodyReady || !actor.skeleton || !actor.animationMixer) continue;
    let dancer = state.dancers.get(actor);
    if (!dancer) {
      sampleClip(actor, 'Idle', 0);
      actor.base.updateMatrixWorld(true);
      dancer = { actor, left: armChain(actor, 'L'), right: armChain(actor, 'R'),
        legs: [legChain(actor, 'L'), legChain(actor, 'R')],
        rest: actor.skeleton.bones.map(b => ({ bone: b, q: b.quaternion.clone(), p: b.position.clone() })),
        feet: [], walkTime: 0, joined: false, role: 'watching', previous: actor.base.position.clone(), lastPosition: actor.base.position.clone() };
      for (const leg of dancer.legs) {
        const foot = new Vector3();
        if (leg) actor.base.worldToLocal(foot.setFromMatrixPosition(leg.wrist.matrixWorld));
        dancer.feet.push(foot);
      }
      state.dancers.set(actor, dancer);
      actor.canLookPlayer = false;
    }
    const spectator = index >= stage.count;
    const slotAngle = index * Math.PI * 2 / stage.count;
    let angle = slotAngle + orbit, radius = stage.radius, joining = 1;
    dancer.role = 'dancing';
    if (spectator) {
      angle = (index - stage.count) * Math.PI * 2 / AUDIENCE_COUNT + .18;
      radius += 2.6 + (index % 2) * .45;
      joining = 0;
      dancer.role = 'watching';
    } else if (index === 3 || index === 11) {
      const offset = index === 3 ? 0 : 20;
      const cycle = Math.floor((time + offset) / 40);
      const phase = (time + offset) % 40;
      const stopTime = cycle * 40 + 20 - offset;
      const outsideAngle = slotAngle + ringStep(stopTime) / stage.radius;
      if (phase >= 16 && phase < 20) {
        joining = 1 - smooth((phase - 16) / 4);
        dancer.role = 'leaving';
      } else if (phase >= 20 && phase < 36) {
        joining = 0;
        dancer.role = 'watching';
      } else if (phase >= 36) {
        joining = smooth((phase - 36) / 4);
        dancer.role = 'joining';
      }
      radius += (1 - joining) * 2.1;
      if (phase >= 16) angle = outsideAngle * (1 - joining) + angle * joining;
    }
    dancer.blend = spectator ? 0 : smooth((joining - .65) / .35);
    dancer.joined = dancer.blend > .001;
    dancer.previous.copy(dancer.lastPosition);
    actor.base.position.set(stage.x + Math.sin(angle) * radius, (scene.props?.groundY ?? state.groundY) + .05, stage.z + Math.cos(angle) * radius);
    const walking = dancer.role === 'joining' || dancer.role === 'leaving';
    const travelled = Math.hypot(actor.base.position.x - dancer.previous.x, actor.base.position.z - dancer.previous.z);
    if (walking) dancer.walkTime += Math.min(travelled, .12) * (actor.allAnims?.Walk?.getClip().duration || 1) / .85;
    dancer.lastPosition.copy(actor.base.position);
    let yaw = angle + Math.PI;
    if (walking && dancer.blend < .5) {
      const dx = actor.base.position.x - dancer.previous.x, dz = actor.base.position.z - dancer.previous.z;
      if (dx * dx + dz * dz > .000001) yaw = Math.atan2(dx, dz);
    }
    scratch.rotation.setFromAxisAngle(UP, yaw);
    if (walking) actor.base.quaternion.slerp(scratch.rotation, 1 - Math.exp(-state.motionDelta * 7));
    else actor.base.quaternion.copy(scratch.rotation);
    actor.baseQuaternion.copy(actor.base.quaternion);
    if (!actor.charMesh?.visible) continue;
    if (!dancer.joined) {
      const socialTime = time + index * 3.73;
      const socialPhase = socialTime % 21;
      const idle = ['Idle', 'Idle2', 'Idle3'][index % 3];
      const clip = walking ? 'Walk' : socialPhase < 13 ? idle : socialPhase < 16.5 ? 'Hello' : 'Happy';
      const clipTime = walking ? dancer.walkTime : socialPhase < 13 ? socialPhase * .85 : socialPhase < 16.5 ? socialPhase - 13 : socialPhase - 16.5;
      sampleClip(actor, clip, clipTime, walking ? .3 : .65);
      if (!walking) {
        // Independent weight shifts and short glances keep the audience alive
        // between gestures without moving them into the dancers' route.
        const shift = Math.sin(socialTime * .7) * .045;
        actor.base.position.x += Math.cos(angle) * shift;
        actor.base.position.z -= Math.sin(angle) * shift;
        actor.base.position.y += Math.sin(socialTime * 1.5) * .008;
        const glance = socialPhase > 10 && socialPhase < 16.5
          ? Math.sin((socialPhase - 10) / 6.5 * Math.PI) * .28 * (index % 2 ? 1 : -1) : 0;
        actor.base.quaternion.setFromAxisAngle(UP, yaw + glance);
        actor.baseQuaternion.copy(actor.base.quaternion);
      }
      if (walking) moving++; else watching++;
      actor.base.updateMatrixWorld(true);
      continue;
    }
    if (dancer.blend < 1) sampleClip(actor, 'Walk', dancer.walkTime, .3);
    for (const pose of dancer.rest) {
      pose.bone.quaternion.slerp(pose.q, dancer.blend);
      pose.bone.position.lerp(pose.p, dancer.blend);
    }
    actor.base.position.y -= .025 * pulse;
    actor.base.updateMatrixWorld(true);
    const inward = scratch.inward.set(-Math.sin(angle), 0, -Math.cos(angle));
    for (let footIndex = 0; footIndex < 2; footIndex++) {
      const leg = dancer.legs[footIndex];
      if (!leg) continue;
      const swing = step % 2 === footIndex;
      // The support foot stays on its previous step while the other lifts and
      // catches up. Work in world space so the feet do not slide with the body.
      const footTime = swing ? Math.max(0, (step - 1 + 2 * smooth(fraction)) * BEAT) : step * BEAT;
      const footAngle = slotAngle + ringStep(footTime) / stage.radius;
      const target = scratch.target.copy(dancer.feet[footIndex]);
      actor.base.localToWorld(target);
      target.x += (Math.sin(footAngle) - Math.sin(angle)) * stage.radius;
      target.z += (Math.cos(footAngle) - Math.cos(angle)) * stage.radius;
      target.y += .025 * pulse + (swing ? .09 * pulse : 0);
      reachHand(leg, target, inward, scratch, true, dancer.blend);
    }
    actors[index] = dancer;
    count++;
  }
  for (let index = 0; index < stage.count; index++) {
    const dancer = actors[index];
    if (!dancer?.left || !dancer.right) continue;
    const actor = dancer.actor;
    const previousDancer = actors[(index + stage.count - 1) % stage.count];
    const nextDancer = actors[(index + 1) % stage.count];
    const previous = previousDancer?.actor;
    const next = nextDancer?.actor;
    const inward = scratch.inward.set(stage.x - actor.base.position.x, 0, stage.z - actor.base.position.z).normalize();
    const leftShoulder = scratch.leftShoulder.setFromMatrixPosition(dancer.left.shoulder.matrixWorld);
    const angle = index * Math.PI * 2 / stage.count + orbit;
    const previousPoint = scratch.hand.set(stage.x + Math.sin(angle - Math.PI * 2 / stage.count) * stage.radius,
      actor.base.position.y, stage.z + Math.cos(angle - Math.PI * 2 / stage.count) * stage.radius);
    const nextPoint = scratch.elbow.set(stage.x + Math.sin(angle + Math.PI * 2 / stage.count) * stage.radius,
      actor.base.position.y, stage.z + Math.cos(angle + Math.PI * 2 / stage.count) * stage.radius);
    const leftIsPrevious = leftShoulder.distanceToSquared(previousPoint) < leftShoulder.distanceToSquared(nextPoint);
    for (let side = 0; side < 2; side++) {
      const chain = side === 0 ? dancer.left : dancer.right;
      const neighbor = side === 0 ? (leftIsPrevious ? previous : next) : (leftIsPrevious ? next : previous);
      if (!neighbor) continue;
      const target = scratch.target.copy(actor.base.position).add(neighbor.base.position).multiplyScalar(.5);
      target.y = scratch.shoulder.setFromMatrixPosition(chain.shoulder.matrixWorld).y - .30 + .045 * pulse;
      const neighborBlend = neighbor === previous ? previousDancer.blend : nextDancer.blend;
      reachHand(chain, target, inward, scratch, false, Math.min(dancer.blend, neighborBlend));
    }
  }
  state.dancerCount = count;
  state.spectatorCount = watching;
  state.walkingCount = moving;
  // Blend the next walking/idle clip from the final joined-hand pose, rather
  // than from the underlying idle pose that was sampled before the IK pass.
  for (const dancer of actors) {
    for (const pose of dancer?.actor.__luloPlayback?.poses || []) {
      pose.lastQ.copy(pose.bone.quaternion);
      pose.lastP.copy(pose.bone.position);
    }
  }
}

export function installSultraLulo(game, layout) {
  if (game.sultraLulo) return game.sultraLulo;
  const state = game.sultraLulo = {
    stage: stageSettings(layout), groundY: layout.groundY ?? 3, motionTime: 0, motionDelta: 0, motionLast: performance.now(), dancers: new Map(), dancerCount: 0,
    element: null, volume: 0, targetVolume: 0, distance: Infinity,
    loading: false, blocked: false, disposed: false, error: null,
  };
  state.actorSlots = new Array(state.stage.count).fill(null);
  state.actorIds = Array.from({ length: state.stage.count + AUDIENCE_COUNT }, (_, index) => `${PREFIX}${index}`);
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
    const now = performance.now();
    state.motionDelta = Math.min(.05, Math.max(0, (now - state.motionLast) / 1000));
    state.motionLast = now;
    if (scene?.id === 'IslandWest' && !document.hidden) {
      const p = scene.player?.base?.position;
      if (p && Math.hypot(p.x - state.stage.x, p.z - state.stage.z) < 55) {
        state.motionTime += state.motionDelta;
        updateDancers(game, state, scene);
      }
    }
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
