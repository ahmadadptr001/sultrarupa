// Reuse the original performances, including the headphone jogger's Run.
// Match the source's outstretched arms to the anoa's hanging-arm bind pose.
const LIMB_CHILD = {
  Shoulder_L: 'Elbow_L', Shoulder_R: 'Elbow_R',
  Elbow_L: 'Wrist_L', Elbow_R: 'Wrist_R',
  Hip_L: 'Knee_L', Hip_R: 'Knee_R',
  Knee_L: 'Ankle_L', Knee_R: 'Ankle_R',
  Ankle_L: 'Toes_L', Ankle_R: 'Toes_R',
};

export function createAnoaAnimator(entry, template) {
  const { actor, bones, sources, reference, mesh } = entry;
  const Quaternion = bones[0].quaternion.constructor;
  const Vector3 = bones[0].position.constructor;
  const names = bones.map(bone => bone.name.replace('Custom_', ''));
  const parents = reference.map(bone => reference.indexOf(bone.parent));
  const sourceRest = template.copies.map(bone => bone.getWorldQuaternion(new Quaternion()));
  const sourcePoints = template.copies.map(bone => bone.getWorldPosition(new Vector3()));
  const targetRest = [], targetPoints = [];
  for (const inverse of mesh.skeleton.boneInverses) {
    const position = new Vector3(), rotation = new Quaternion();
    inverse.clone().invert().decompose(position, rotation, new Vector3());
    targetRest.push(rotation); targetPoints.push(position);
  }
  const alignment = bones.map(() => new Quaternion());
  for (let i = 0; i < bones.length; i++) {
    const child = names.indexOf(LIMB_CHILD[names[i]]);
    if (child < 0) continue;
    alignment[i].setFromUnitVectors(
      targetPoints[child].clone().sub(targetPoints[i]).normalize(),
      sourcePoints[child].clone().sub(sourcePoints[i]).normalize());
  }
  for (let i = 0; i < bones.length; i++) {
    if (/^(Wrist|Toes)_/.test(names[i]) && parents[i] >= 0) alignment[i].copy(alignment[parents[i]]);
  }
  const correction = bones.map((_, i) => sourceRest[i].clone().invert()
    .multiply(alignment[i]).multiply(targetRest[i]));
  // The native Idle already crouches and turns its feet outward. Using the
  // source bind pose as the leg baseline carries that offset onto the anoa's
  // short legs, making even standing look bowed. Anchor only the legs to the
  // authored stance; retain every animated change from the source performance.
  const idle = actor.allAnims?.Idle?._clip;
  if (idle) {
    const idleLocal = template.copies.map(bone => bone.quaternion.clone());
    const sourceNames = new Map(template.copies.map((bone, i) => [bone.name, i]));
    for (const track of idle.tracks) {
      const suffix = '.quaternion';
      if (!track.name.endsWith(suffix)) continue;
      const index = sourceNames.get(track.name.slice(0, -suffix.length));
      if (index !== undefined) idleLocal[index].fromArray(track.createInterpolant().evaluate(0));
    }
    const idleWorld = bones.map(() => new Quaternion()), ready = new Uint8Array(bones.length);
    function idleRotation(index) {
      if (ready[index]) return idleWorld[index];
      const parent = parents[index];
      idleWorld[index].copy(parent >= 0 ? idleRotation(parent) : template.neutral.quaternion)
        .multiply(idleLocal[index]);
      ready[index] = 1;
      return idleWorld[index];
    }
    for (let i = 0; i < bones.length; i++) {
      if (/^(Hip|Knee|Ankle|Toes)_/.test(names[i])) {
        correction[i].copy(idleRotation(i)).invert().multiply(targetRest[i]);
      }
    }
  }
  const sourceWorld = bones.map(() => new Quaternion());
  const targetWorld = bones.map(() => new Quaternion());
  const targetPosition = bones.map(() => new Vector3());
  const rootIndex = parents.findIndex(parent => parent < 0);
  // Straighter legs reach lower than the native crouch. Keep the visual soles
  // above their authored floor without changing the physics capsule or inputs.
  // Retain nine low sole samples per hoof; no vertex scan runs during animation.
  const contacts = [];
  let soleFloor = Infinity;
  const positions = mesh.geometry.attributes.position;
  if (idle) for (const side of ['L', 'R']) {
    const index = names.indexOf(`Ankle_${side}`);
    if (index < 0) continue;
    const points = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      if (y > .16 || (side === 'L' ? x < .06 : x > -.06)) continue;
      soleFloor = Math.min(soleFloor, y);
      points.push(new Vector3(x, y, z));
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const cells = new Array(9);
    for (const point of points) {
      const x = Math.min(2, Math.floor((point.x - minX) / (maxX - minX || 1) * 3));
      const z = Math.min(2, Math.floor((point.z - minZ) / (maxZ - minZ || 1) * 3));
      const cell = x + z * 3;
      if (!cells[cell] || point.y < cells[cell].y) cells[cell] = point;
    }
    for (const point of cells) if (point) contacts.push({
      index, point: point.applyMatrix4(mesh.skeleton.boneInverses[index]),
    });
  }
  const contactPosition = new Vector3();
  const done = new Uint8Array(bones.length), inverseParent = new Quaternion();
  const actions = Object.entries(actor.allAnims || {}).map(([name, action]) => ({
    action, status: { name, weight: 0, time: 0 },
  }));
  function solve(index) {
    if (done[index]) return;
    const parent = parents[index];
    if (parent >= 0) solve(parent);
    sourceWorld[index].copy(parent >= 0 ? sourceWorld[parent] : actor.charMesh.quaternion)
      .multiply(sources[index].quaternion);
    targetWorld[index].copy(sourceWorld[index]).multiply(correction[index]).normalize();
    bones[index].quaternion.copy(targetWorld[index]);
    if (parent >= 0) {
      inverseParent.copy(targetWorld[parent]).invert();
      bones[index].quaternion.premultiply(inverseParent);
    }
    targetPosition[index].copy(bones[index].position);
    if (parent >= 0) targetPosition[index].applyQuaternion(targetWorld[parent]).add(targetPosition[parent]);
    done[index] = 1;
  }
  return {
    mode: 'native-retarget',
    clips: Object.fromEntries(Object.entries(actor.allAnims || {}).map(([name, action]) => [name, action._clip])),
    active: [],
    update() {
      done.fill(0);
      for (let i = 0; i < bones.length; i++) solve(i);
      let soleY = soleFloor;
      for (const { index, point } of contacts) {
        contactPosition.copy(point).applyQuaternion(targetWorld[index]).add(targetPosition[index]);
        soleY = Math.min(soleY, contactPosition.y);
      }
      if (rootIndex >= 0 && contacts.length) bones[rootIndex].position.y += soleFloor - soleY;
      this.active.length = 0;
      for (const { action, status } of actions) {
        if (action.enabled !== false && action.weight > .0001) {
          status.weight = action.weight;
          status.time = action.time;
          this.active.push(status);
        }
      }
    },
  };
}
