import { initScene } from './scene.js';
import { createNeonGround } from './ground.js';
import * as THREE from 'three';

// Ensure body is ready for full-canvas rendering
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const { scene, camera, renderer } = initScene(canvas);

// Ground
const ground = createNeonGround();
scene.add(ground);

// Demo cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x00aaff })
);
cube.position.y = 0.5;
scene.add(cube);

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.015;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
