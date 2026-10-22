// Motions authored for the anoa's hanging arms and short legs. These clips use
// the replacement's bind pose; humanoid shoulder and wrist rotations are never
// used as the starting pose for walking, running, idle, or the opening hello.
const TAU = Math.PI * 2;
const DURATIONS = { AnoaIdle: 3.2, AnoaWalk: 1, AnoaRun: .72, AnoaHello: 2, AnoaAcknowledge: 1.1 };
const NATIVE_CLIPS = {
  Idle: 'AnoaIdle', Idle2: 'AnoaIdle', Idle3: 'AnoaIdle',
  Walk: 'AnoaWalk', Run: 'AnoaRun', Hello: 'AnoaHello', Gain: 'AnoaAcknowledge',
};
const clamp = (value) => Math.min(1, Math.max(0, value));
function ease(value) { const t = clamp(value); return t * t * (3 - 2 * t); }
// Contact, compression, passing, push-off, and recovery. Periodic cubic curves
// retain velocity across both the loop seam and the knee's direction changes.
const GAITS = {
  walk: {
    hip: [-.34, -.20, 0, .23, .33, .22, -.12, -.36],
    knee: [.12, .20, .12, .11, .45, .78, .55, .20],
    foot: [-.08, 0, 0, .10, .28, .10, -.08, -.12],
  },
  run: {
    hip: [-.52, -.29, .03, .37, .48, .12, -.45, -.61],
    knee: [.32, .43, .22, .55, 1.02, 1.17, .91, .51],
    foot: [-.08, .02, .13, .30, .24, .08, -.08, -.12],
  },
};
function cycle(values, phase) {
  const cursor = ((phase % 1 + 1) % 1) * values.length;
  const i = Math.floor(cursor), t = cursor - i, size = values.length;
  const a = values[(i + size - 1) % size], b = values[i];
  const c = values[(i + 1) % size], d = values[(i + 2) % size];
  return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t
    + (-a + 3 * b - 3 * c + d) * t * t * t);
}

function poseAt(name, time, duration) {
  const phase = time / duration * TAU;
  const pose = { joints: {}, lift: 0, sway: 0 };
  const set = (bone, x = 0, y = 0, z = 0) => { pose.joints[bone] = [x, y, z]; };
  if (name === 'AnoaRun' || name === 'AnoaWalk') {
    const run = name === 'AnoaRun', gait = GAITS[run ? 'run' : 'walk'];
    const twist = Math.cos(phase), rock = Math.sin(phase);
    pose.sway = (run ? .009 : .016) * rock;
    set('Root_M', 0, (run ? .055 : .045) * twist, (run ? .015 : .023) * rock);
    set('Spine1_M', (run ? .11 : .025) + .012 * Math.sin(phase * 2), -.045 * twist, -.018 * rock);
    set('Chest_M', run ? .035 : .008, -(run ? .065 : .035) * twist, -.012 * rock);
    set('Head_M', run ? -.10 : -.025, .035 * twist, .012 * rock);
    const soleHeights = [];
    for (const [side, sign] of [['L', 1], ['R', -1]]) {
      const legPhase = time / duration + (sign < 0 ? .5 : 0);
      const hip = cycle(gait.hip, legPhase), knee = cycle(gait.knee, legPhase);
      const foot = cycle(gait.foot, legPhase);
      const swing = Math.cos(phase - .18) * sign;
      set(`Hip_${side}`, hip, -.025 * twist, -.012 * rock);
      set(`Knee_${side}`, knee);
      set(`Ankle_${side}`, foot - hip - knee);
      // Bent elbows and a delayed forearm swing read as running, while keeping
      // hands beside the body instead of holding both arms out sideways.
      set(`Shoulder_${side}`, (run ? .48 : .25) * swing, -.025 * sign, .025 * sign);
      set(`Elbow_${side}`, -(run ? .88 : .24) - (run ? .15 : .09) * Math.sin(phase - .40) * sign);
      set(`Wrist_${side}`, .025 * Math.sin(phase - .7) * sign, 0, .015 * sign);
      soleHeights.push(.58 - .30 * Math.cos(hip) - .28 * Math.cos(hip + knee)
        + .20 * (1 - Math.cos(foot)) - .12 * Math.abs(Math.sin(foot)));
    }
    // Short legs need a small pelvis dip at contact, then a rise over the
    // supporting foot. This removes the floating, rigid-hip appearance.
    pose.lift = -Math.min(...soleHeights) + .004;
  } else if (name === 'AnoaHello') {
    const progress = time / duration;
    const raised = ease(progress / .24) * (1 - ease((progress - .76) / .24));
    const wave = Math.sin(clamp((progress - .23) / .54) * TAU * 2);
    set('Shoulder_L', -.16 * raised, 0, (1.65 + .07 * wave) * raised);
    set('Elbow_L', -.18 * raised, 0, (.48 + .16 * wave) * raised);
    // The greeting comes from the elbow. The small wrist arc avoids the
    // full wrist rolls in the original humanoid Hello clip.
    set('Wrist_L', 0, 0, .10 * wave * raised);
    set('Shoulder_R', -.04 * raised, 0, -.04 * raised);
    set('Elbow_R', -.10 * raised);
    set('Head_M', -.035 * raised, -.045 * raised, -.035 * raised);
    set('Root_M', 0, -.025 * raised, -.012 * raised);
    set('Spine1_M', -.012 * raised, -.02 * raised, -.015 * raised);
    set('Chest_M', 0, -.035 * raised);
  } else if (name === 'AnoaAcknowledge') {
    const progress = time / duration, gesture = Math.sin(Math.PI * progress) ** 2;
    set('Head_M', .10 * Math.sin(TAU * progress) * gesture, .035 * gesture);
    set('Spine1_M', -.025 * gesture);
    set('Chest_M', .035 * gesture);
    set('Shoulder_L', -.16 * gesture, 0, .025 * gesture);
    set('Shoulder_R', -.12 * gesture, 0, -.025 * gesture);
    set('Elbow_L', -.30 * gesture);
    set('Elbow_R', -.24 * gesture);
  } else {
    set('Root_M', 0, .006 * Math.sin(phase), .004 * Math.sin(phase));
    set('Chest_M', .012 * Math.sin(phase), 0, -.004 * Math.sin(phase));
    set('Head_M', -.010 * Math.sin(phase), .008 * Math.sin(phase - .4));
    set('Shoulder_L', -.018 * Math.sin(phase));
    set('Shoulder_R', -.018 * Math.sin(phase));
  }
  return pose;
}

export function createAnoaAnimator(entry, template) {
  const { actor, bones, reference, rootIndex } = entry;
  const nativeClip = actor.allAnims?.Hello?._clip || actor.animation?._clip;
  const quaternionTrack = nativeClip?.tracks.find((track) => track.name.endsWith('.quaternion'));
  if (!quaternionTrack) return null;
  const Quaternion = bones[0].quaternion.constructor;
  const rest = bones.map((bone) => bone.quaternion.clone());
  const parentFrames = reference.map((bone) => {
    const parent = reference.indexOf(bone.parent);
    return parent < 0 ? new Quaternion() : template.copies[parent].getWorldQuaternion(new Quaternion());
  });
  const inverseFrames = parentFrames.map((rotation) => rotation.clone().invert());
  const euler = bones[0].rotation.clone(), rotation = new Quaternion();
  const clips = {}, samples = {};
  for (const [name, duration] of Object.entries(DURATIONS)) {
    const frames = Math.ceil(duration * 60), times = [], values = bones.map(() => []);
    const lifts = [], sways = [];
    for (let frame = 0; frame <= frames; frame++) {
      const time = duration * frame / frames, pose = poseAt(name, time, duration);
      times.push(time); lifts.push(pose.lift); sways.push(pose.sway);
      bones.forEach((bone, index) => {
        euler.set(...(pose.joints[bone.name.replace('Custom_', '')] || [0, 0, 0]), 'XYZ');
        rotation.setFromEuler(euler).premultiply(inverseFrames[index])
          .multiply(parentFrames[index]).multiply(rest[index]).normalize();
        values[index].push(...rotation.toArray());
      });
    }
    const tracks = bones.map((bone, index) => new quaternionTrack.constructor(
      `${bone.name}.quaternion`, times, values[index]));
    clips[name] = new nativeClip.constructor(name, duration, tracks);
    samples[name] = {
      interpolants: tracks.map((track) => track.createInterpolant()), lifts, sways,
    };
  }
  const combined = bones.map(() => new Quaternion()), target = new Quaternion();
  const neutralInverse = template.neutral.quaternion.clone().invert();
  const meshRotation = new Quaternion();
  const rootPosition = bones[rootIndex].position.clone();
  const restRootPosition = rootPosition.clone();
  const state = { clips, active: [], phase: 0, locomotion: 0, running: 0 };
  let previousTime = actor.animationMixer.time;
  const weightOf = (name) => {
    const action = actor.allAnims?.[name];
    return action?.enabled === false ? 0 : Math.max(0, action?.weight || 0);
  };
  state.update = () => {
    const now = actor.animationMixer.time;
    // Use game time, including pauses. A stalled render must not skip an entire
    // stride on its next frame. Both gaits share this phase during crossfades.
    const dt = Math.min(.1, Math.max(0, now - previousTime));
    previousTime = now;
    const walk = weightOf('Walk'), run = weightOf('Run');
    const idle = weightOf('Idle') + weightOf('Idle2') + weightOf('Idle3');
    const hello = weightOf('Hello'), acknowledge = weightOf('Gain');
    let other = 0;
    for (const name of Object.keys(actor.allAnims || {})) {
      if (!(name in NATIVE_CLIPS)) other += weightOf(name);
    }
    const custom = walk + run + idle + hello + acknowledge;
    const motionTarget = (walk + run) / Math.max(.001, walk + run + idle);
    state.locomotion += (motionTarget - state.locomotion) * (1 - Math.exp(-dt / .12));
    const runningTarget = run / Math.max(.001, walk + run);
    state.running += (runningTarget - state.running) * (1 - Math.exp(-dt / .16));
    const pace = Math.min(1.18, Math.max(.75, actor.moveAnims?.Run?.timeScale || 1));
    state.phase = (state.phase + dt * (.90 + .52 * state.running) * pace
      * Math.min(1, state.locomotion * 3)) % 1;
    const specialTotal = hello + acknowledge;
    const special = specialTotal / Math.max(.001, custom);
    const motion = state.locomotion * (1 - special);
    const actions = [
      ['AnoaIdle', (1 - state.locomotion) * (1 - special), now % clips.AnoaIdle.duration],
      ['AnoaWalk', motion * (1 - state.running), state.phase * clips.AnoaWalk.duration],
      ['AnoaRun', motion * state.running, state.phase * clips.AnoaRun.duration],
    ];
    for (const name of ['Hello', 'Gain']) {
      const action = actor.allAnims?.[name], clipName = NATIVE_CLIPS[name];
      if (action) actions.push([clipName, weightOf(name) / Math.max(.001, custom),
        clamp(action.time / action._clip.duration) * clips[clipName].duration]);
    }
    let total = 0, rootLift = 0, rootSway = 0;
    state.active.length = 0;
    for (const [clipName, weight, time] of actions) {
      if (weight < .0001) continue;
      const clip = clips[clipName], sample = samples[clipName];
      const blend = weight / (total + weight);
      sample.interpolants.forEach((interpolant, index) => {
        target.fromArray(interpolant.evaluate(time));
        if (total === 0) combined[index].copy(target);
        else combined[index].slerp(target, blend);
      });
      const frame = time / clip.duration * (sample.lifts.length - 1);
      const low = Math.floor(frame), high = Math.min(low + 1, sample.lifts.length - 1);
      rootLift += (sample.lifts[low] + (sample.lifts[high] - sample.lifts[low]) * (frame - low)) * weight;
      rootSway += (sample.sways[low] + (sample.sways[high] - sample.sways[low]) * (frame - low)) * weight;
      total += weight;
      state.active.push({ name: clipName, weight, time });
    }
    if (total === 0) return;
    // Fill the entire ordinary pose with the custom rig. Native crossfade
    // weights can briefly sum below one; that must not reintroduce humanoid
    // shoulder rotations. Unmapped gameplay emotes retain their native pose.
    const strength = other > .0001 ? custom / Math.max(.001, custom + other) : 1;
    meshRotation.copy(actor.charMesh.quaternion).multiply(neutralInverse);
    combined[rootIndex].premultiply(meshRotation);
    bones.forEach((bone, index) => bone.quaternion.slerp(combined[index], strength));
    rootPosition.copy(restRootPosition); rootPosition.y += rootLift / total;
    rootPosition.x += rootSway / total;
    bones[rootIndex].position.lerp(rootPosition, strength);
  };
  return state;
}
