# Custom character animation

`public/assets/player-character.js` replaces the intro guide and the playable
character with `public/models/player-anoa.glb`. Other island NPCs retain
their original appearance. The GLB is a static textured mesh; the web module
provides its skeleton without changing the source asset.

The replacement has 18 joints placed for its own proportions. Its bind pose
comes from the untouched original character resource, independent of the live
animation frame or the island where it attaches. Normalized skin weights are
restricted to anatomical neighbours, with rigid heads and shoes. The geometry
is prepared once and each actor attachment gets a separate skeleton.
The hand boundary includes the inward-facing thumbs while excluding the skirt
and thighs below them. This prevents thumb vertices from retaining pelvis
weights and stretching into spikes when the arm is raised.

`public/assets/anoa-animation.js` builds four quaternion animation clips for the
anoa's own bind pose: `AnoaIdle`, `AnoaWalk`, `AnoaRun`, and `AnoaHello`. Rotation
axes are authored in the anoa's Y-up space and transformed into each bind-pose
parent frame. Child joint positions retain the replacement's limb lengths.
Running alternates short strides and opposing arm swings; the wrists stay
neutral, and ankle counter-rotation keeps fitted soles close to level. The
greeting lifts the left arm, waves from the elbow, and limits wrist movement to
0.10 radians before lowering the arm to rest.

The original mixer still controls action timing and crossfade weights. Native
`Idle`/`Idle2`/`Idle3`, `Walk`, `Run`, and `Hello` actions sample the corresponding
anoa clip. The intro NPC already plays `Hello` when
`game.store.intro.descentDone` becomes true, so no timer or duplicate greeting is
needed. `actor.moveAnims.Run` and `actor.moveAnims.Walk` retain speed-dependent
playback; releasing movement blends back to the anoa idle. Other native emotes
and gameplay actions retain their existing retargeted animation. The clip
objects and currently sampled actions are inspectable at
`game.playerCharacter.entry.animator.clips` and `.active`.

Movement, camera, input, physics, animation completion callbacks, and the boat's
transforms remain controlled by the original game. The custom clips replace
visual joint rotation and root bob only; they do not move the physics body.
Fitted accessories stay on the same bones throughout animation, and fitted
shoes suppress the original model's `shoesOffset` lift.

Do not hide original meshes with `visible = false`: the NPC controller uses
that flag to decide whether to update its skeleton and movement. Original
meshes receive a private invisible material instead. Their materials are
restored and the replacement skeleton is disposed when the active actor changes.

When replacing this GLB, update the authored-space joint centres and skinning
regions to match the new anatomy. These are calibrated for the current model,
not a general-purpose automatic humanoid rigging system.
