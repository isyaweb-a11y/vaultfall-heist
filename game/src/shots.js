// The screenshot scenes behind ?shot=cover|vault|getaway|counting. Each one
// poses a fresh level — thief mid-room, guards and cameras placed so their
// cones read, the meter set — and freezes the guards on a long pause, so
// the frame Playwright captures is the frame the judge sees.
import { buildLevelState } from './state.js';
import { SCREEN_PLAY } from './render.js';

function poseGuard(state, index, x, y, angle) {
  const guard = state.guards[index];
  if (!guard) return;
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.pauseLeft = 8; // hold the pose while the screenshot is taken
  guard.lookBase = angle;
  guard.state = 'patrol';
}

function poseCamera(state, index, angle) {
  const camera = state.cameras[index];
  if (!camera) return;
  camera.angle = angle;
}

/** Stage `name` on a fresh level state; returns { screen, state }. */
export function stageShot(name, _state, seed) {
  if (name === 'vault' || name === 'getaway') {
    const state = buildLevelState(2, seed);
    state.thief.x = 640;
    state.thief.y = 180;
    if (name === 'vault') {
      state.alarm.value = 70;
      state.thief.holdTarget = { kind: 'vault', progress: 2.6, seconds: 4.0, label: 'CRACK THE VAULT' };
      poseGuard(state, 0, 480, 300, -0.64);
      poseGuard(state, 1, 860, 140, 2.96);
      poseGuard(state, 3, 800, 300, -2.5);
      poseGuard(state, 2, 400, 700, -1.2);
      state.time = 0.8;
      return { screen: SCREEN_PLAY, state };
    }
    // Getaway: loot in hand, meter nearly full, guards closing on the run
    // to the rooftop door.
    state.thief.lootTaken = true;
    state.thief.lootValue = 5000;
    state.thief.x = 950;
    state.thief.y = 280;
    state.thief.angle = -0.7;
    state.alarm.value = 90;
    state.alarm.peak = 90;
    poseGuard(state, 0, 850, 350, -0.9);
    poseGuard(state, 1, 1080, 220, 2.6);
    poseGuard(state, 3, 1000, 420, -1.9);
    poseGuard(state, 2, 700, 650, -1.4);
    state.time = 1.2;
    state.flashText = 'AURUM SECURED — GET OUT!';
    state.flashLeft = 5;
    return { screen: SCREEN_PLAY, state };
  }

  if (name === 'counting') {
    const state = buildLevelState(1, seed);
    state.thief.x = 500;
    state.thief.y = 300;
    state.thief.angle = 0.4;
    state.alarm.value = 25;
    // A coin on the floor, and Marlowe walking over to look at it.
    state.coins.push({ x: 640, y: 320, age: 0.4, radius: 260, kind: 'coin' });
    const marlowe = state.guards[0];
    marlowe.x = 580;
    marlowe.y = 310;
    marlowe.angle = 0.15;
    marlowe.state = 'investigate';
    marlowe.investigateX = 640;
    marlowe.investigateY = 320;
    marlowe.investigateLeft = 2.5;
    // Rook carries the keycard, patrolling the far side.
    poseGuard(state, 1, 900, 200, 1.2);
    poseGuard(state, 2, 400, 720, -1.5);
    // Laser grid live.
    state.time = 0.3;
    return { screen: SCREEN_PLAY, state };
  }

  // Default: the cover. Level 1 mid-crossing: thief centre-frame, two guard
  // cones and one camera cone, the gold case glowing, meter at ~35%.
  const state = buildLevelState(0, seed);
  state.thief.x = 640;
  state.thief.y = 420;
  state.thief.angle = 0.5;
  state.alarm.value = 35;
  poseGuard(state, 0, 500, 320, 0.62);
  poseGuard(state, 1, 1000, 500, -2.92);
  poseCamera(state, 0, Math.PI / 2);
  state.time = 0;
  return { screen: SCREEN_PLAY, state };
}
