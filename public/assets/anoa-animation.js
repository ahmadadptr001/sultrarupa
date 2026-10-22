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
  const sourceWorld = bones.map(() => new Quaternion());
  const targetWorld = bones.map(() => new Quaternion());
  const done = new Uint8Array(bones.length), inverseParent = new Quaternion();
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
    done[index] = 1;
  }
  return {
    mode: 'native-retarget',
    clips: Object.fromEntries(Object.entries(actor.allAnims || {}).map(([name, action]) => [name, action._clip])),
    active: [],
    update() {
      done.fill(0);
      for (let i = 0; i < bones.length; i++) solve(i);
      this.active.length = 0;
      for (const [name, action] of Object.entries(actor.allAnims || {})) {
        if (action.enabled !== false && action.weight > .0001) this.active.push({ name, weight: action.weight, time: action.time });
      }
    },
  };
}
