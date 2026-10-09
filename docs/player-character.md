# Custom character animation

`public/assets/player-character.js` replaces the intro guide and the playable
character with `public/models/player-character.glb`. Other island NPCs retain
their original appearance. The GLB is a static textured mesh; the web module
provides its skeleton without changing the source asset.

The replacement has 18 joints placed for its own proportions. Its bind pose
comes from the untouched original character resource, independent of the live
animation frame or the island where it attaches. Normalized skin weights are
restricted to anatomical neighbours, with rigid heads and shoes. The geometry
is prepared once and each actor attachment gets a separate skeleton.

The native animation mixer drives joint rotations, and the native root motion
is converted from rig units to model units. Child joint positions retain the
replacement's limb lengths. Movement, camera, input, physics, animation state
transitions, and the boat's transforms remain controlled by the original game.

Do not hide original meshes with `visible = false`: the NPC controller uses
that flag to decide whether to update its skeleton and movement. Original
meshes receive a private invisible material instead. Their materials are
restored and the replacement skeleton is disposed when the active actor changes.

When replacing this GLB, update the authored-space joint centres and skinning
regions to match the new anatomy. These are calibrated for the current model,
not a general-purpose automatic humanoid rigging system.
