// Uses the game's own Three.js instance; no second renderer or animation loop.
import { installOpeningBoat } from './opening-boat.js';
import { installPlayerCharacter } from './player-character.js';
import { installSultraMobileControls } from './sultra-mobile-controls.js';
import { installSultraIntroWordmark } from './sultra-intro-wordmark.js';
import { installSultraIsland } from './sultra-island.js';
import {
  b6 as BufferAttribute, b7 as BufferGeometry, b5 as Mesh,
  a$ as MeshBasicMaterial, cd as Group, ct as Texture,
  bQ as SRGBColorSpace, b0 as DoubleSide, cF as PlaneGeometry,
} from './vendor.75f6e6ae65453426.js';

const MODEL_URL = '/models/munas-ix-logo-hd.glb';
const LANDMARK_HEIGHT = 480;
const REAR_CLEARANCE = 700;
const ISLANDS = new Set(['IslandIntro']);

function createCloudHaze() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  // Overlapping soft puffs, with transparent edges instead of rectangular cards.
  for (const [x, y, radius] of [[120, 140, 85], [190, 110, 95], [270, 135, 100], [345, 115, 78], [395, 145, 63]]) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.45, 'rgba(250, 254, 255, 0.65)');
    gradient.addColorStop(0.8, 'rgba(239, 250, 255, 0.14)');
    gradient.addColorStop(1, 'rgba(239, 250, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new Texture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  const group = new Group();
  group.name = 'Sultra sky - drifting white clouds';
  // Spread clouds around the whole coast, independently of the logo's position.
  const layers = Array.from({ length: 22 }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 420 + (index % 4) * 105;
    return [Math.cos(angle) * radius, 65 + (index % 5) * 28,
      Math.sin(angle) * radius, 185 + (index % 4) * 45,
      50 + (index % 3) * 17, 0.38 + (index % 3) * 0.07];
  });
  layers.forEach(([x, y, z, width, height, opacity], index) => {
    const cloud = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({
      map: texture, transparent: true, opacity, depthWrite: false,
      side: DoubleSide, fog: false, toneMapped: false,
    }));
    cloud.position.set(x, y, z);
    cloud.userData.restX = x;
    cloud.userData.phase = index * 1.7;
    cloud.userData.restY = y;
    cloud.userData.opacity = opacity;
    cloud.userData.speed = 1.2 + (index % 4) * 0.22;
    group.add(cloud);
  });
  return group;
}

function positionBehindIsland(logo, scene) {
  const boat = scene.points['BoatIntro.001']?.position;
  const dx = scene.center.x - (boat?.x ?? scene.bbox.min.x);
  const dz = scene.center.z - (boat?.z ?? scene.center.z);
  const length = Math.hypot(dx, dz) || 1;
  const x = dx / length, z = dz / length;
  const rearExtent = Math.abs(x) * (scene.bbox.max.x - scene.bbox.min.x) / 2
    + Math.abs(z) * (scene.bbox.max.z - scene.bbox.min.z) / 2;
  logo.position.set(
    scene.center.x + x * (rearExtent + REAR_CLEARANCE),
    scene.bbox.max.y + 6,
    scene.center.z + z * (rearExtent + REAR_CLEARANCE),
  );
}

// Reader for our static, uncompressed, baked-transform GLB. Materials use the
// original logo colours, independent of the game's daylight or fog settings.
async function loadLogo() {
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid logo GLB');
  const jsonLength = view.getUint32(12, true);
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
  const binaryOffset = 20 + jsonLength + 8;
  const types = { 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  function attribute(index) {
    const accessor = gltf.accessors[index], data = gltf.bufferViews[accessor.bufferView];
    const Type = types[accessor.componentType], size = sizes[accessor.type];
    if (!Type || !size || data.byteStride || accessor.sparse) throw new Error('Unsupported logo accessor');
    const offset = binaryOffset + (data.byteOffset || 0) + (accessor.byteOffset || 0);
    return new BufferAttribute(new Type(buffer, offset, accessor.count * size), size);
  }
  const image = gltf.images[0], imageView = gltf.bufferViews[image.bufferView];
  const bitmap = await createImageBitmap(new Blob([
    new Uint8Array(buffer, binaryOffset + (imageView.byteOffset || 0), imageView.byteLength),
  ], { type: image.mimeType }));
  const texture = new Texture(bitmap);
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  const materials = gltf.materials.map((material) => {
    const result = new MeshBasicMaterial({
      color: 0xffffff,
      map: material.emissiveTexture ? texture : null,
      side: DoubleSide, fog: false, toneMapped: false,
    });
    if (!material.emissiveTexture) {
      result.color.fromArray(material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1]);
    }
    result.name = material.name;
    // Atmospheric perspective: soften saturation and dark/light contrast without
    // making the solid logo transparent or changing its portable GLB texture.
    result.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <tonemapping_fragment>', `
        float logoLuma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        vec3 logoSoft = mix(vec3(logoLuma), gl_FragColor.rgb, 0.65);
        gl_FragColor.rgb = mix(logoSoft, vec3(0.32, 0.57, 0.68), 0.38);
        #include <tonemapping_fragment>
      `);
    };
    result.customProgramCacheKey = () => 'munas-sultra-atmosphere-v1';
    return result;
  });
  const root = new Group();
  root.name = 'MUNAS IX — PERMIKOMNAS';
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', attribute(primitive.attributes.POSITION));
      geometry.setAttribute('normal', attribute(primitive.attributes.NORMAL));
      geometry.setAttribute('uv', attribute(primitive.attributes.TEXCOORD_0));
      geometry.setIndex(attribute(primitive.indices));
      geometry.computeBoundingSphere();
      const object = new Mesh(geometry, materials[primitive.material]);
      object.name = mesh.name;
      root.add(object);
    }
  }
  root.scale.setScalar(LANDMARK_HEIGHT / 2);
  root.userData.asset = MODEL_URL;
  root.userData.height = LANDMARK_HEIGHT;
  return root;
}

export function installMunasLandmark(game) {
  installSultraIsland(game);
  installOpeningBoat(game);
  installPlayerCharacter(game);
  installSultraIntroWordmark(game);
  installSultraMobileControls(game);
  if (game.munasLandmark) return;
  const state = game.munasLandmark = {
    status: 'loading', object: null, haze: null, scene: null,
    sky: null, skyScale: null,
  };
  const promise = loadLogo().then((logo) => {
    state.object = logo;
    state.haze = createCloudHaze();
    state.status = 'ready';
  }).catch((error) => {
    state.status = 'error';
    console.error('[MUNAS landmark]', error);
  });
  // Include the asset in the existing loading screen rather than popping it in.
  game.hooks.beforePreload.watch(() => game.app.$preloader.task(promise));
  game.hooks.beforeRender.watch(() => {
    const scene = game.scenes?.current, logo = state.object;
    if (!scene?.base || !logo) return;
    if (state.scene !== scene) {
      logo.removeFromParent();
      state.haze.removeFromParent();
      if (state.sky) {
        state.sky.scale.copy(state.skyScale);
        state.sky.updateMatrix();
        state.sky.updateMatrixWorld(true);
        state.sky = null;
      }
      state.scene = scene;
      if (!ISLANDS.has(scene.id)) return;
      // The original sky dome has radius 800; a horizon-scale logo would sit
      // outside it and be painted over. Enclose it for this opening scene only.
      if (scene.sky?.sky) {
        state.sky = scene.sky.sky;
        state.skyScale = state.sky.scale.clone();
        state.sky.scale.setScalar(2400);
        state.sky.updateMatrix();
        state.sky.updateMatrixWorld(true);
      }
      // Opening boat scene only, floating clear of the tallest island geometry.
      positionBehindIsland(logo, scene);
      scene.base.add(logo);
      state.haze.position.set(scene.center.x, 0, scene.center.z);
      scene.base.add(state.haze);
      logo.updateMatrixWorld(true);
    }
    if (logo.parent !== scene.base) return;
    logo.visible = true;
    state.haze.visible = logo.visible;
    const camera = scene.getCurrentCamera()?.cam;
    if (!camera) return;
    // The horizon logo sits beyond the original island-only clipping distance.
    if (camera.far < 5000) {
      camera.far = 5000;
      camera.updateProjectionMatrix();
    }
    camera.updateWorldMatrix(true, false);
    const p = camera.matrixWorld.elements;
    logo.rotation.y = Math.atan2(p[12] - logo.position.x, p[14] - logo.position.z);
    logo.updateMatrixWorld(true);
    for (const cloud of state.haze.children) {
      const seconds = game.time.elapsed / 1000;
      cloud.position.x = ((cloud.userData.restX + seconds * cloud.userData.speed + 900) % 1800) - 900;
      cloud.position.y = cloud.userData.restY + Math.sin(seconds * 0.05 + cloud.userData.phase) * 0.8;
      cloud.quaternion.copy(camera.quaternion);
    }
    state.haze.updateMatrixWorld(true);
  });
}
