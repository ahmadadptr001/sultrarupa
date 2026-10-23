function yieldToBrowser() {
  return globalThis.scheduler?.yield ? globalThis.scheduler.yield()
    : new Promise(resolve => setTimeout(resolve, 0));
}

function imageReady(image) {
  if (Array.isArray(image)) return image.length > 0 && image.every(imageReady);
  if (image?.isTexture) return imageReady(image.image);
  if (!image || image.complete === false) return false;
  return !('videoWidth' in image) || image.readyState >= 2;
}

// Upload the existing HD pixels in small tasks before the native first render.
// Keep render-target/depth textures under the renderer's normal ownership.
export async function prepareSceneTextures(renderer, root) {
  if (!renderer?.initTexture || !root?.traverseVisible) return;
  const textures = new Set();
  function collect(value) {
    if (Array.isArray(value)) { value.forEach(collect); return; }
    if (value?.isTexture && !value.isRenderTargetTexture && !value.isDepthTexture
      && imageReady(value.image)) textures.add(value);
  }
  root.traverseVisible(object => {
    collect(object.background);
    collect(object.environment);
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (!material || material.visible === false) continue;
      Object.values(material).forEach(collect);
      for (const uniform of Object.values(material.uniforms || {})) collect(uniform.value);
    }
  });
  await yieldToBrowser();
  let sliceStart = performance.now();
  for (const texture of textures) {
    renderer.initTexture(texture);
    if (performance.now() - sliceStart >= 6) {
      await yieldToBrowser();
      sliceStart = performance.now();
    }
  }
  // Shader setup/rendering starts in a fresh task rather than extending the
  // final upload batch. The native readiness barrier still awaits this work.
  await yieldToBrowser();
}
