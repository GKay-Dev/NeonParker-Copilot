import * as THREE from 'three';
import { initScene } from './scene.js';

// Initialize scene with reusable module
const { scene, camera, renderer, resize } = initScene();
document.body.appendChild(renderer.domElement);

// Application-specific setup: create rotating cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Handle window resize
window.addEventListener('resize', resize);

// Animation loop
function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.015;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
