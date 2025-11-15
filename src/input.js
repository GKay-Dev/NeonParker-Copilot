/**
 * InputManager - Unified input handling for keyboard, gamepad, and touch
 * Returns normalized input state for easy consumption by game logic
 */
export class InputManager {
  constructor() {
    // Input state
    this.keys = {};
    this.gamepadIndex = null;
    
    // Control state (output)
    this.state = {
      axis: { x: 0, y: 0 },  // Normalized movement axes (-1 to 1)
      jump: false,
      sprint: false
    };
    
    // Touch UI elements
    this.touchUI = null;
    this.joystickData = { active: false, x: 0, y: 0 };
    this.touchButtons = { jump: false, sprint: false };
    
    // Setup input handlers
    this._setupKeyboard();
    this._setupGamepad();
    this._setupTouchUI();
  }
  
  /**
   * Setup keyboard event listeners
   * @private
   */
  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
  
  /**
   * Setup gamepad connection detection
   * @private
   */
  _setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected');
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
      }
    });
  }
  
  /**
   * Setup touch UI for mobile devices
   * @private
   */
  _setupTouchUI() {
    // Only show touch UI on touch-capable devices (pointer: coarse)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (!isTouchDevice) {
      return;
    }
    
    // Create touch UI container
    this.touchUI = document.createElement('div');
    this.touchUI.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 200px;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(this.touchUI);
    
    // Create virtual joystick
    const joystickArea = this._createJoystick();
    this.touchUI.appendChild(joystickArea);
    
    // Create action buttons
    const buttons = this._createButtons();
    this.touchUI.appendChild(buttons);
  }
  
  /**
   * Create virtual joystick
   * @private
   */
  _createJoystick() {
    const area = document.createElement('div');
    area.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 120px;
      height: 120px;
      pointer-events: auto;
    `;
    
    const base = document.createElement('div');
    base.style.cssText = `
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.4);
    `;
    area.appendChild(base);
    
    const stick = document.createElement('div');
    stick.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      left: 35px;
      top: 35px;
      transition: all 0.1s;
    `;
    area.appendChild(stick);
    
    // Touch handlers
    const handleTouch = (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = area.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 35;
        
        if (distance > 0) {
          const normalizedX = deltaX / maxDistance;
          const normalizedY = deltaY / maxDistance;
          
          // Clamp to circle
          const magnitude = Math.min(distance / maxDistance, 1);
          this.joystickData.x = normalizedX * magnitude;
          this.joystickData.y = normalizedY * magnitude;
          
          // Update stick position
          const stickX = 35 + this.joystickData.x * maxDistance;
          const stickY = 35 + this.joystickData.y * maxDistance;
          stick.style.left = stickX + 'px';
          stick.style.top = stickY + 'px';
          
          this.joystickData.active = true;
        }
      }
    };
    
    const handleTouchEnd = () => {
      this.joystickData.active = false;
      this.joystickData.x = 0;
      this.joystickData.y = 0;
      stick.style.left = '35px';
      stick.style.top = '35px';
    };
    
    area.addEventListener('touchstart', handleTouch);
    area.addEventListener('touchmove', handleTouch);
    area.addEventListener('touchend', handleTouchEnd);
    
    return area;
  }
  
  /**
   * Create action buttons (jump, sprint)
   * @private
   */
  _createButtons() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 15px;
      pointer-events: auto;
    `;
    
    // Jump button
    const jumpBtn = this._createButton('A', 'rgba(0, 255, 0, 0.3)');
    jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchButtons.jump = true;
    });
    jumpBtn.addEventListener('touchend', () => {
      this.touchButtons.jump = false;
    });
    container.appendChild(jumpBtn);
    
    // Sprint button
    const sprintBtn = this._createButton('B', 'rgba(255, 165, 0, 0.3)');
    sprintBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchButtons.sprint = true;
    });
    sprintBtn.addEventListener('touchend', () => {
      this.touchButtons.sprint = false;
    });
    container.appendChild(sprintBtn);
    
    return container;
  }
  
  /**
   * Create a single button
   * @private
   */
  _createButton(label, color) {
    const btn = document.createElement('div');
    btn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: bold;
      user-select: none;
      -webkit-user-select: none;
    `;
    btn.textContent = label;
    return btn;
  }
  
  /**
   * Read keyboard input
   * @private
   */
  _readKeyboard() {
    let x = 0;
    let y = 0;
    let jump = false;
    let sprint = false;
    
    // Movement keys
    if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    
    // Action keys
    if (this.keys['Space']) jump = true;
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) sprint = true;
    
    return { x, y, jump, sprint };
  }
  
  /**
   * Read gamepad input
   * @private
   */
  _readGamepad() {
    if (this.gamepadIndex === null) {
      return null;
    }
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    
    if (!gamepad) {
      return null;
    }
    
    // Axes (left stick)
    const x = Math.abs(gamepad.axes[0]) > 0.15 ? gamepad.axes[0] : 0;
    const y = Math.abs(gamepad.axes[1]) > 0.15 ? gamepad.axes[1] : 0;
    
    // Buttons: A (0), B (1), LB (4), RB (5)
    const jump = gamepad.buttons[0]?.pressed || gamepad.buttons[1]?.pressed || false;
    const sprint = gamepad.buttons[4]?.pressed || gamepad.buttons[5]?.pressed || false;
    
    return { x, y, jump, sprint };
  }
  
  /**
   * Read touch input
   * @private
   */
  _readTouch() {
    if (!this.joystickData.active && !this.touchButtons.jump && !this.touchButtons.sprint) {
      return null;
    }
    
    return {
      x: this.joystickData.x,
      y: this.joystickData.y,
      jump: this.touchButtons.jump,
      sprint: this.touchButtons.sprint
    };
  }
  
  /**
   * Update and return current input state
   * Call this every frame to get the latest input
   * @returns {{ axis: {x: number, y: number}, jump: boolean, sprint: boolean }}
   */
  update() {
    // Read all input sources
    const keyboard = this._readKeyboard();
    const gamepad = this._readGamepad();
    const touch = this._readTouch();
    
    // Merge inputs (priority: touch > gamepad > keyboard)
    let finalInput = keyboard;
    
    if (gamepad) {
      finalInput = {
        x: gamepad.x || finalInput.x,
        y: gamepad.y || finalInput.y,
        jump: gamepad.jump || finalInput.jump,
        sprint: gamepad.sprint || finalInput.sprint
      };
    }
    
    if (touch) {
      finalInput = {
        x: touch.x || finalInput.x,
        y: touch.y || finalInput.y,
        jump: touch.jump || finalInput.jump,
        sprint: touch.sprint || finalInput.sprint
      };
    }
    
    // Update state
    this.state.axis.x = finalInput.x;
    this.state.axis.y = finalInput.y;
    this.state.jump = finalInput.jump;
    this.state.sprint = finalInput.sprint;
    
    return this.state;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.touchUI && this.touchUI.parentNode) {
      this.touchUI.parentNode.removeChild(this.touchUI);
    }
  }
}
