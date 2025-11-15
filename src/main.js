import { initScene } from './scene.js';
import { createNeonGround } from './ground.js';
import { InputManager } from './input.js';
import * as THREE from 'three';

// Ensure body is ready for full-canvas rendering
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const { scene, camera, renderer } = initScene(canvas);

// Initialize input manager
const input = new InputManager();

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
  // Update input state
  const controls = input.update();
  
  // Adjust cube rotation based on sprint state
  const speedFactor = controls.sprint ? 2.0 : 1.0;
  cube.rotation.x += 0.01 * speedFactor;
  cube.rotation.y += 0.015 * speedFactor;
  
  // Future: integrate with Player when ready
  // if (player) {
  //   player.handleInput(controls);
  // }
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
