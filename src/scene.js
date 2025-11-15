import * as THREE from 'three';

/**
 * Initialize a Three.js scene with GPU-friendly defaults
 * @param {HTMLCanvasElement} canvas - Optional canvas element to use for rendering
 * @returns {Object} Object containing scene, camera, renderer, and resize function
 */
export function initScene(canvas) {
  // Create renderer with GPU-friendly defaults
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });
  
  // Disable physically correct lighting
  renderer.physicallyCorrectLights = false;
  
  // Disable shadow map for performance
  renderer.shadowMap.enabled = false;
  
  // Set tone mapping to None
  renderer.toneMapping = THREE.NoToneMapping;
  
  // Enable sRGB output color space
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Clamp device pixel ratio to max 2 for performance
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Create scene with background color
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(2, 2, 3);
  
  // Add hemisphere light (ambient lighting)
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
  scene.add(hemisphereLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
  
  // Responsive resize function
  function resize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size and pixel ratio (clamped to max 2)
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  return {
    scene,
    camera,
    renderer,
    resize
  };
}
