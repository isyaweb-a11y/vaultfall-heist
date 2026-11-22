// Keyboard + mouse state, read fresh every frame. The game asks this
// module what is held, never the DOM directly.
import { KEYS } from './config.js';

export function makeInput() {
  return {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false, // consumed by the game loop each frame
    clickX: 0,
    clickY: 0,
    pressed: new Set(), // keys pressed since the last frame was read
  };
}

export function attachInput(input, element) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.code);
    input.pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  element.addEventListener('mousemove', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * 800;
  });
  element.addEventListener('mousedown', (event) => {
    const rect = element.getBoundingClientRect();
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = ((event.clientX - rect.left) / rect.width) * 1280;
    input.clickY = ((event.clientY - rect.top) / rect.height) * 800;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
}

/** Read the movement axes out of the held keys. */
export function readAxes(input) {
  return {
    up: KEYS.up.some((code) => input.keys.has(code)),
    down: KEYS.down.some((code) => input.keys.has(code)),
    left: KEYS.left.some((code) => input.keys.has(code)),
    right: KEYS.right.some((code) => input.keys.has(code)),
    sneak: KEYS.sneak.some((code) => input.keys.has(code)),
    interact: KEYS.interact.some((code) => input.keys.has(code)),
  };
}

export function wasPressed(input, codes) {
  return codes.some((code) => input.pressed.has(code));
}

export function consumePressed(input) {
  input.pressed.clear();
  input.clicked = false;
}
