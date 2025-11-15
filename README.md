# NeonParker-Copilot Vite + Three.js Starter

This project is a minimal Three.js scene (rotating cube) built with Vite.

## Scene Module

The scene module (`src/scene.js`) initializes the Three.js rendering context with a camera, lighting, and renderer configured for WebGL rendering.

## Input System

The `InputManager` (`src/input.js`) provides unified input handling across keyboard, gamepad, and touch devices. It returns a normalized input state that can be easily consumed by game logic.

### Features
- **Keyboard Support**: WASD or Arrow keys for movement, Space for jump, Shift for sprint
- **Gamepad Support**: Left stick for movement, A/B buttons for jump, LB/RB buttons for sprint
- **Touch UI**: Virtual joystick and action buttons (automatically shown on mobile devices with `pointer: coarse`)
- **Auto-hide on Desktop**: Touch UI automatically hidden on devices with `pointer: fine` (mouse/trackpad)

### Usage

```javascript
import { InputManager } from './input.js';

// Create an instance (do this once at startup)
const input = new InputManager();

// In your game loop, call update() to get the current input state
function animate() {
  const controls = input.update();
  
  // controls.axis: { x: number, y: number } - normalized movement axes (-1 to 1)
  // controls.jump: boolean - true when jump button/key is pressed
  // controls.sprint: boolean - true when sprint button/key is pressed
  
  // Example: Use sprint to adjust speed
  const speedFactor = controls.sprint ? 2.0 : 1.0;
  
  // Use controls.axis for movement
  // player.move(controls.axis.x * speedFactor, controls.axis.y * speedFactor);
  
  requestAnimationFrame(animate);
}
```

### Control Mappings

| Action | Keyboard | Gamepad | Touch |
|--------|----------|---------|-------|
| Move Forward | W or ↑ | Left Stick Up | Virtual Joystick |
| Move Backward | S or ↓ | Left Stick Down | Virtual Joystick |
| Move Left | A or ← | Left Stick Left | Virtual Joystick |
| Move Right | D or → | Left Stick Right | Virtual Joystick |
| Jump | Space | A or B button | A Button (green) |
| Sprint | Shift | LB or RB button | B Button (orange) |

### Integration Example

The cube in `src/main.js` demonstrates the input system by spinning faster when the sprint key/button is held.

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Artifacts output to `dist/`.

## GitHub Pages Deployment
Deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`. On every push to `main` the site is built and published to:

https://gkay-dev.github.io/NeonParker-Copilot/

If the page appears empty:
- Confirm the latest workflow run succeeded.
- Ensure `vite.config.js` has the correct `base: '/NeonParker-Copilot/'`.

## Troubleshooting
If a workflow was canceled during a rebase or force-push, re-run the workflow via the Actions tab or push a new commit.
