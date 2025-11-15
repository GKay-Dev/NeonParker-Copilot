// save as src/scene.js
import * as THREE from 'three';

/**
 * Initialize a Three.js scene using a provided canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, resize: () => void }}
 */
export function initScene(canvas) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    depth: true,
    stencil: false,
    failIfMajorPerformanceCaveat: false
  });

  renderer.physicallyCorrectLights = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(2, 2, 3);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.1);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', resize);

  return { scene, camera, renderer, resize };
}
