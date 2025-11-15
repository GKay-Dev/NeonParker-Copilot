// save as src/player.js
import * as THREE from 'three';

/**
 * Player controller class for future gameplay integration.
 * Handles player movement, rotation, and input management.
 */
export class Player {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add the player to
   * @param {THREE.Vector3} position - Initial position of the player
   */
  constructor(scene, position = new THREE.Vector3(0, 0.5, 0)) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.rotation = 0;

    // Movement parameters
    this.speed = 5.0;
    this.turnSpeed = 2.0;
    this.acceleration = 0.1;
    this.friction = 0.9;

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Create player mesh (placeholder cube for now)
    this.mesh = this._createMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Bind input handlers
    this._setupInputHandlers();
  }

  /**
   * Create the visual representation of the player
   * @private
   */
  _createMesh() {
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.3,
      roughness: 0.7
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Setup keyboard input handlers
   * @private
   */
  _setupInputHandlers() {
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
  }

  /**
   * Handle keydown events
   * @private
   */
  _onKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.input.forward = true;
        break;
      case 's':
      case 'arrowdown':
        this.input.backward = true;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = true;
        break;
    }
  }

  /**
   * Handle keyup events
   * @private
   */
  _onKeyUp(event) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.input.forward = false;
        break;
      case 's':
      case 'arrowdown':
        this.input.backward = false;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = false;
        break;
    }
  }

  /**
   * Update player state based on input and physics
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime) {
    // Handle rotation
    if (this.input.left) {
      this.rotation += this.turnSpeed * deltaTime;
    }
    if (this.input.right) {
      this.rotation -= this.turnSpeed * deltaTime;
    }

    // Calculate movement direction based on rotation
    const forwardDir = new THREE.Vector3(
      Math.sin(this.rotation),
      0,
      Math.cos(this.rotation)
    );

    // Handle forward/backward movement
    if (this.input.forward) {
      this.velocity.addScaledVector(forwardDir, this.acceleration);
    }
    if (this.input.backward) {
      this.velocity.addScaledVector(forwardDir, -this.acceleration);
    }

    // Clamp velocity to max speed
    if (this.velocity.length() > this.speed) {
      this.velocity.normalize().multiplyScalar(this.speed);
    }

    // Apply friction
    this.velocity.multiplyScalar(this.friction);

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Keep player above ground
    this.position.y = Math.max(this.position.y, 0.5);

    // Update mesh transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  /**
   * Get the current position of the player
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Set the position of the player
   * @param {THREE.Vector3} position
   */
  setPosition(position) {
    this.position.copy(position);
    this.mesh.position.copy(position);
  }

  /**
   * Remove the player from the scene and cleanup
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
