// save as src/input.js
// InputManager: normalizes keyboard, touch (virtual joystick + jump/sprint buttons), and gamepad
// into a unified state: { axis: { x, y }, jump: boolean, sprint: boolean }.
// - Axis is camera-relative friendly (x: right+, y: forward+).
// - Includes deadzone and clamping, simple smoothing via lerp.
// - Injects a minimal touch UI with id="touch-ui" and CSS classes.

export class InputManager {
  constructor(opts = {}) {
    this.deadzone = opts.deadzone ?? 0.15;
    this.smooth = opts.smooth ?? 0.2;
    this.joystickRadius = opts.joystickRadius ?? 60;
    this.gamepadIndex = opts.gamepadIndex ?? 0;

    this.state = { axis: { x: 0, y: 0 }, jump: false, sprint: false };

    this._kb = { x: 0, y: 0, jump: false, sprint: false, keys: new Set() };
    this._gp = { x: 0, y: 0, jump: false, sprint: false };
    this._touch = {
      x: 0, y: 0, jump: false, sprint: false,
      active: false, originX: 0, originY: 0, pointerId: null
    };
    this._smoothed = { x: 0, y: 0 };

    this._bindKeyboard();
    this._setupTouchUI(opts.enableTouchUI);
  }

  update() {
    this._pollGamepad();
    const candidates = [
      { x: this._touch.x, y: this._touch.y },
      { x: this._gp.x, y: this._gp.y },
      { x: this._kb.x, y: this._kb.y },
    ];
    let axis = { x: 0, y: 0 };
    const preferred = candidates.find(v => Math.abs(v.x) > 0.001 || Math.abs(v.y) > 0.001);
    if (preferred) axis = preferred;
    else {
      axis.x = clamp(this._touch.x + this._gp.x + this._kb.x, -1, 1);
      axis.y = clamp(this._touch.y + this._gp.y + this._kb.y, -1, 1);
    }

    this._smoothed.x = lerp(this._smoothed.x, axis.x, 1 - Math.pow(1 - this.smooth, 60 / 60));
    this._smoothed.y = lerp(this._smoothed.y, axis.y, 1 - Math.pow(1 - this.smooth, 60 / 60));

    const jump = this._touch.jump || this._kb.jump || this._gp.jump;
    const sprint = this._touch.sprint || this._kb.sprint || this._gp.sprint;

    this.state.axis.x = this._smoothed.x;
    this.state.axis.y = this._smoothed.y;
    this.state.jump = !!jump;
    this.state.sprint = !!sprint;

    return this.getState();
  }

  getState() {
    return {
      axis: { x: this.state.axis.x, y: this.state.axis.y },
      jump: this.state.jump,
      sprint: this.state.sprint,
    };
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown, { capture: false });
    window.removeEventListener('keyup', this._onKeyUp, { capture: false });
    this._detachTouchUI();
  }

  _bindKeyboard() {
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      this._kb.keys.add(k);
      this._recalcKeyboardAxes();
      if (k === ' ') this._kb.jump = true;
      if (k === 'shift') this._kb.sprint = true;
    };
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      this._kb.keys.delete(k);
      this._recalcKeyboardAxes();
      if (k === ' ') this._kb.jump = false;
      if (k === 'shift') this._kb.sprint = false;
    };
    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp, { passive: true });
  }

  _recalcKeyboardAxes() {
    const ks = this._kb.keys;
    const x = (ks.has('d') || ks.has('arrowright') ? 1 : 0) + (ks.has('a') || ks.has('arrowleft') ? -1 : 0);
    const y = (ks.has('w') || ks.has('arrowup') ? 1 : 0) + (ks.has('s') || ks.has('arrowdown') ? -1 : 0);
    const n = normalize2(x, y);
    this._kb.x = n.x; this._kb.y = n.y;
  }

  _pollGamepad() {
    const gps = navigator.getGamepads?.();
    if (!gps) { this._gp.x = this._gp.y = 0; this._gp.jump = this._gp.sprint = false; return; }
    const gp = gps[this.gamepadIndex];
    if (!gp) { this._gp.x = this._gp.y = 0; this._gp.jump = this._gp.sprint = false; return; }
    const rawX = gp.axes[0] ?? 0;
    const rawY = gp.axes[1] ?? 0;
    const dzX = applyDeadzone(rawX, this.deadzone);
    const dzY = applyDeadzone(rawY, this.deadzone);
    const v = normalize2(dzX, -dzY);
    this._gp.x = v.x; this._gp.y = v.y;
    const btn = i => !!gp.buttons?.[i]?.pressed;
    this._gp.jump = btn(0) || btn(1);
    this._gp.sprint = btn(10) || btn(11) || btn(4) || btn(5);
  }

  _setupTouchUI(enableTouchUI) {
    const preferTouch = enableTouchUI ?? matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (!preferTouch) { this._ui = null; return; }
    this._ui = document.getElementById('touch-ui');
    if (!this._ui) {
      this._ui = document.createElement('div');
      this._ui.id = 'touch-ui';
      document.body.appendChild(this._ui);
    }
    this._injectStyles();

    this._joystick = document.createElement('div');
    this._joystick.className = 'touch-joystick';
    this._stick = document.createElement('div');
    this._stick.className = 'touch-stick';
    this._joystick.appendChild(this._stick);

    this._buttonsWrap = document.createElement('div');
    this._buttonsWrap.className = 'touch-buttons';
    this._btnJump = document.createElement('button');
    this._btnJump.className = 'touch-button touch-button--jump';
    this._btnJump.textContent = 'Jump';
    this._btnSprint = document.createElement('button');
    this._btnSprint.className = 'touch-button touch-button--sprint';
    this._btnSprint.textContent = 'Sprint';

    this._buttonsWrap.appendChild(this._btnJump);
    this._buttonsWrap.appendChild(this._btnSprint);
    this._ui.appendChild(this._joystick);
    this._ui.appendChild(this._buttonsWrap);

    const onJoyDown = (e) => {
      e.preventDefault();
      if (this._touch.active) return;
      const p = getPoint(e);
      this._touch.active = true;
      this._touch.pointerId = getPointerId(e);
      this._touch.originX = p.x;
      this._touch.originY = p.y;
      this._updateStickVisual(0, 0);
      setPointerCaptureSafe(this._joystick, e);
    };
    const onJoyMove = (e) => {
      if (!this._touch.active || getPointerId(e) !== this._touch.pointerId) return;
      const p = getPoint(e);
      const dx = p.x - this._touch.originX;
      const dy = p.y - this._touch.originY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy), this.joystickRadius);
      const nx = Math.cos(angle) * (dist / this.joystickRadius);
      const ny = Math.sin(angle) * (dist / this.joystickRadius);
      let ax = applyDeadzone(nx, this.deadzone);
      let ay = applyDeadzone(-ny, this.deadzone);
      const norm = normalize2(ax, ay);
      this._touch.x = norm.x;
      this._touch.y = norm.y;
      this._updateStickVisual(nx * this.joystickRadius, ny * this.joystickRadius);
    };
    const onJoyUp = (e) => {
      if (!this._touch.active || getPointerId(e) !== this._touch.pointerId) return;
      this._touch.active = false;
      this._touch.pointerId = null;
      this._touch.x = this._touch.y = 0;
      this._updateStickVisual(0, 0);
      releasePointerCaptureSafe(this._joystick, e);
    };

    this._joystick.addEventListener('pointerdown', onJoyDown, { passive: false });
    window.addEventListener('pointermove', onJoyMove, { passive: false });
    window.addEventListener('pointerup', onJoyUp, { passive: true });
    window.addEventListener('pointercancel', onJoyUp, { passive: true });
    window.addEventListener('pointerleave', onJoyUp, { passive: true });

    const onJumpDown = (e) => { e.preventDefault(); this._touch.jump = true; };
    const onJumpUp = () => { this._touch.jump = false; };
    this._btnJump.addEventListener('pointerdown', onJumpDown, { passive: false });
    this._btnJump.addEventListener('pointerup', onJumpUp, { passive: true });
    this._btnJump.addEventListener('pointercancel', onJumpUp, { passive: true });
    this._btnJump.addEventListener('pointerleave', onJumpUp, { passive: true });

    const onSprintDown = (e) => { e.preventDefault(); this._touch.sprint = true; };
    const onSprintUp = () => { this._touch.sprint = false; };
    this._btnSprint.addEventListener('pointerdown', onSprintDown, { passive: false });
    this._btnSprint.addEventListener('pointerup', onSprintUp, { passive: true });
    this._btnSprint.addEventListener('pointercancel', onSprintUp, { passive: true });
    this._btnSprint.addEventListener('pointerleave', onSprintUp, { passive: true });
  }

  _detachTouchUI() {
    if (!this._ui) return;
    this._ui.remove();
    this._ui = null;
  }

  _updateStickVisual(dx, dy) {
    if (this._stick) this._stick.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  _injectStyles() {
    if (document.getElementById('touch-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'touch-ui-styles';
    style.textContent = `
#touch-ui { position: fixed; inset: 0; pointer-events: none; user-select: none; z-index: 1000; }
#touch-ui .touch-joystick {
  position: absolute; left: 18px; bottom: 18px;
  width: ${this.joystickRadius * 2}px; height: ${this.joystickRadius * 2}px;
  border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  pointer-events: auto; touch-action: none; backdrop-filter: blur(2px);
}
#touch-ui .touch-stick {
  position: absolute; left: 50%; top: 50%;
  width: ${this.joystickRadius * 0.9}px; height: ${this.joystickRadius * 0.9}px;
  margin-left: -${this.joystickRadius * 0.45}px; margin-top: -${this.joystickRadius * 0.45}px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(0,255,255,0.6), rgba(0,128,255,0.35));
  border: 1px solid rgba(0,200,255,0.4); transition: transform 60ms linear;
}
#touch-ui .touch-buttons {
  position: absolute; right: 18px; bottom: 18px; display: flex; flex-direction: column; gap: 12px; pointer-events: auto;
}
#touch-ui .touch-button {
  min-width: 84px; height: 56px; padding: 0 14px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.2); color: #fff; background: rgba(0,0,0,0.35);
  font: 600 14px/1 system-ui,sans-serif; box-shadow: 0 6px 18px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.08);
  backdrop-filter: blur(3px); touch-action: none;
}
#touch-ui .touch-button--jump { background: linear-gradient(180deg, rgba(0,170,255,0.45), rgba(0,110,200,0.45)); }
#touch-ui .touch-button--sprint { background: linear-gradient(180deg, rgba(0,255,170,0.45), rgba(0,200,110,0.45)); }
@media (pointer: fine) { #touch-ui { display: none; } }
    `.trim();
    document.head.appendChild(style);
  }
}

// Utility functions
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }
function normalize2(x, y) {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  const m = 1 / Math.max(1, len);
  return { x: x * m, y: y * m };
}
function applyDeadzone(v, dz) {
  const s = Math.sign(v), a = Math.abs(v);
  if (a <= dz) return 0;
  return s * (a - dz) / (1 - dz);
}
function getPointerId(e) { return e.pointerId ?? 0; }
function getPoint(e) {
  if ('clientX' in e) return { x: e.clientX, y: e.clientY };
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: 0, y: 0 };
}
function setPointerCaptureSafe(el, e) { try { el.setPointerCapture?.(e.pointerId); } catch {} }
function releasePointerCaptureSafe(el, e) { try { el.releasePointerCapture?.(e.pointerId); } catch {} }
