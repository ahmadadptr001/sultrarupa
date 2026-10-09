# MUNAS IX opening logo

`public/models/munas-ix-logo-hd.glb` contains only the MUNAS IX / PERMIKOMNAS logo. Its silhouette and lettering were traced from the supplied 1173 × 1341 reference, extruded into solid geometry, and mapped to the original colours. The white owl face is retained; there is no rectangular background or camera.

The asset has 13,218 triangles, two material primitives, and an embedded PNG. It is about 1.7 MB. Its bottom is at y=0, height is 2, and front faces +Z. It is a relief-style logo with reference artwork on the faces.

## Final behaviour

The existing `loadWebGL` entry point in `public/assets/webgl.3250e36a65453426.js` installs `munas-landmark.js`. That module uses the bundled Three.js classes and existing frame hooks.

- Display throughout IslandIntro, including the opening screen before **Start the journey** and the boat intro.
- Detach on arrival at any playable island.
- Height: 480 world units (`LANDMARK_HEIGHT`), larger than the opening island.
- Position: behind the island's far edge as seen from the opening boat,
  with its base 6 units above the highest island bound.
- The logo stays above the water and island skyline from the first frame;
  there is no underwater entrance or vertical rise animation.
- The opening sky dome expands to enclose the distant logo and is restored
  when leaving the intro, preventing the sky from hiding the logo.
- The web material softens saturation and contrast with an atmospheric sky tint;
  the portable GLB retains the original artwork.
- Twenty-two bright white clouds spread around the entire coast and drift with
  the wind. Their world positions are independent of the logo and its rotation.
- Rotate horizontally towards the camera, staying upright.
- Original camera controls: no custom two-finger look or idle-reset behaviour.
- Clean logo: no grass, moss, or buried foundation.

The GLB reader supports this static, uncompressed asset: Float32 attributes, Uint16/Uint32 indices, embedded image, and baked transforms. Preserve that format when replacing the asset. If replacing the upstream game bundle, retain the landmark import and installer call in `loadWebGL`.
