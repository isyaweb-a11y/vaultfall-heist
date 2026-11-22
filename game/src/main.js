// Vaultfall boot: the game loop, level flow, win/bust screens, the alarm
// and the tools — everything the room modules feed into, in one place.
import { ROOM, SCORE, TOOLS, KEYS, LASER } from './config.js';
import { buildLevelState, refreshSolids } from './state.js';
import { LEVELS } from './levels.js';
import { updateGuard, guardSeesThief } from './guards.js';
import { updateCamera, cameraSeesThief } from './cameras.js';
import {
  moveThief,
  tossCoin,
  fireEmp,
  rechargeEmp,
  findHoldTarget,
  progressHold,
  applyHold,
} from './thief.js';
import { updateAlarm } from './alarm.js';
import {
  attachInput,
  readAxes,
  wasPressed,
  consumePressed,
  makeInput,
} from './input.js';
import {
  makeSound,
  playStep,
  playCoin,
  playCoinLand,
  playEmp,
  playPick,
  playLoot,
  playSpotted,
  playBusted,
  playWin,
  playTick,
  playLaser,
  startPad,
  toggleMute,
} from './sound.js';
import {
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_BUSTED,
  SCREEN_LEVEL_CLEAR,
  SCREEN_WIN,
  drawGame,
  drawTitle,
  drawBusted,
  drawLevelClear,
  drawWin,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

const input = makeInput();
attachInput(input, canvas);
const sound = makeSound();

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed') ?? 1234);
const seed = Number.isFinite(seedParam) ? seedParam : 1234;
const shotName = params.get('shot');
const devWin = params.get('dev') === 'win';

let screen = SCREEN_TITLE;
let state = buildLevelState(0, seed);
let best = Number(window.localStorage.getItem('vaultfall-best') ?? 0) || 0;
let tickTimer = 0;
let lastTime = 0;
let holdGraceLeft = 0; // a hold survives a brief loss of its target (tailing a guard)

function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

function gradeFor(score) {
  if (score >= SCORE.gradeS) return 'S';
  if (score >= SCORE.gradeA) return 'A';
  if (score >= SCORE.gradeB) return 'B';
  return 'C';
}

function flash(text, seconds) {
  state.flashText = text;
  state.flashLeft = seconds;
}

function spawnExtraGuard() {
  if (state.extraGuardSpawned) return;
  state.extraGuardSpawned = true;
  const ex = state.level.extraction;
  const guard = {
    index: state.guards.length,
    name: 'Vega',
    x: ex.x,
    y: ex.y + 120,
    angle: 0,
    waypoints: [
      [ex.x - 120, ex.y + 60],
      [ex.x + 120, ex.y + 60],
      [ex.x + 120, ex.y - 60],
      [ex.x - 120, ex.y - 60],
    ],
    waypointIndex: 1,
    pause: 0.8,
    pauseLeft: 0,
    speed: 110,
    fast: false,
    state: 'patrol',
    suspicion: 0,
    investigateX: 0,
    investigateY: 0,
    investigateLeft: 0,
    lookTimer: 0,
    lookBase: 0,
    hasKeycard: false,
    spotted: false,
  };
  // Keep the new guard inside the room.
  guard.waypoints = guard.waypoints.map(([x, y]) => [
    Math.min(ROOM.width - 60, Math.max(60, x)),
    Math.min(ROOM.height - 60, Math.max(60, y)),
  ]);
  guard.x = Math.min(ROOM.width - 60, Math.max(60, guard.x));
  guard.y = Math.min(ROOM.height - 60, Math.max(60, guard.y));
  state.guards.push(guard);
}

function startLevel(index) {
  state = buildLevelState(index, seed);
  screen = SCREEN_PLAY;
  setStatus(`${state.level.name}: ${state.level.briefing}`);
}

function startNight() {
  best = Number(window.localStorage.getItem('vaultfall-best') ?? 0) || 0;
  startLevel(0);
  startPad(sound);
}

function finishLevel() {
  const timeBonus = Math.max(0, Math.round((state.level.parSeconds - state.levelTime) * SCORE.timeBonusPerSecond));
  const ghostBonus = state.alarm.everSpotted ? 0 : SCORE.ghostBonus;
  state.levelScore = state.thief.lootValue + timeBonus + ghostBonus;
  state.totalScore += state.levelScore;
  state.grade = gradeFor(state.levelScore);
  if (state.levelIndex >= LEVELS.length - 1) {
    screen = SCREEN_WIN;
    if (state.totalScore > best) {
      best = state.totalScore;
      window.localStorage.setItem('vaultfall-best', String(best));
    }
    playWin(sound);
    setStatus(`Clean getaway! Total loot $${state.totalScore.toLocaleString('en-US')}.`);
  } else {
    screen = SCREEN_LEVEL_CLEAR;
    playWin(sound);
    setStatus(`${state.level.name} clear, grade ${state.grade}. Press Enter for the next room.`);
  }
}

function failNight() {
  screen = SCREEN_BUSTED;
  playBusted(sound);
  setStatus(`Busted in ${state.level.name}. Press R to try the night again.`);
}

/** Is the thief inside an active laser right now? */
function thiefInLaser() {
  const thief = state.thief;
  if (thief.inVent) return false;
  for (const laser of state.level.lasers ?? []) {
    const cycle = (state.time + (laser.phase ?? 0)) % LASER.cycleSeconds;
    const on = cycle < LASER.cycleSeconds * LASER.onFraction;
    if (!on) continue;
    if (
      thief.x > laser.x - 6 &&
      thief.x < laser.x + laser.w + 6 &&
      thief.y > laser.y &&
      thief.y < laser.y + laser.h
    ) {
      return true;
    }
  }
  const ring = state.level.laserRing;
  if (ring) {
    const dx = thief.x - ring.x;
    const dy = thief.y - ring.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 34 && dist < ring.radius + 10) {
      const thiefAngle = Math.atan2(dy, dx);
      for (let i = 0; i < ring.beams; i += 1) {
        const beamAngle = state.time * ring.spin + (i * Math.PI * 2) / ring.beams;
        let d = Math.abs(thiefAngle - beamAngle) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        if (d < 0.12) return true;
      }
    }
  }
  return false;
}

function updatePlay(dt) {
  state.time += dt;
  state.levelTime += dt;
  if (state.flashLeft > 0) {
    state.flashLeft -= dt;
    if (state.flashLeft <= 0) state.flashText = null;
  }
  const axes = readAxes(input);
  state.thief.sneaking = axes.sneak;

  // Vent check: inside a vent the thief crawls and lasers cannot touch them.
  state.thief.inVent = (state.level.vents ?? []).some(
    (vent) =>
      state.thief.x > vent.x &&
      state.thief.x < vent.x + vent.w &&
      state.thief.y > vent.y &&
      state.thief.y < vent.y + vent.h,
  );

  // Coin toss on Q or on a click: the coin lands where the mouse points.
  if (wasPressed(input, KEYS.coin) || input.clicked) {
    const tx = input.clicked ? input.clickX : state.thief.x + Math.cos(state.thief.angle) * 120;
    const ty = input.clicked ? input.clickY : state.thief.y + Math.sin(state.thief.angle) * 120;
    const coin = tossCoin(state.thief, Math.min(ROOM.width - 30, Math.max(30, tx)), Math.min(ROOM.height - 30, Math.max(30, ty)));
    if (coin) {
      state.coins.push(coin);
      playCoin(sound);
      flash('Coin tossed — guards will look.', 1.6);
    } else {
      flash('Out of coins.', 1.2);
    }
  }
  // EMP on E.
  if (wasPressed(input, KEYS.emp)) {
    if (fireEmp(state.thief)) {
      for (const camera of state.cameras) camera.disabledLeft = TOOLS.empDurationSeconds;
      state.alarm.value = Math.min(100, state.alarm.value + 6);
      playEmp(sound);
      flash('EMP pulse — cameras dark for 6 seconds.', 1.8);
    } else {
      flash('EMP battery too low.', 1.2);
    }
  }
  if (wasPressed(input, KEYS.mute)) {
    const muted = toggleMute(sound);
    flash(muted ? 'Sound muted.' : 'Sound on.', 1.2);
  }
  rechargeEmp(state.thief, dt);

  // Movement + footsteps.
  const noise = moveThief(state.thief, axes, dt, state.solids);
  state.noises = [];
  if (noise) {
    state.noises.push(noise);
    state.ripples.push({ x: state.thief.x, y: state.thief.y, age: 0 });
    playStep(sound, state.thief.sneaking);
  }
  for (const coin of state.coins) {
    coin.age += dt;
    if (coin.age < 3) {
      state.noises.push({ kind: 'coin', x: coin.x, y: coin.y, radius: 260, age: coin.age });
    }
  }
  state.coins = state.coins.filter((coin) => coin.age < 3.2);
  for (const ripple of state.ripples) ripple.age += dt;
  state.ripples = state.ripples.filter((ripple) => ripple.age < 0.8);

  // Guards and cameras.
  let guardSees = false;
  for (const guard of state.guards) {
    const event = updateGuard(guard, dt, {
      thief: state.thief,
      solids: state.solids,
      noises: state.noises,
      time: state.time,
    });
    if (event === 'spotted') {
      playSpotted(sound);
      flash(`${guard.name} has you in sight!`, 1.4);
    }
    if (guardSeesThief(guard, state.thief, state.solids)) guardSees = true;
  }
  let cameraSees = false;
  for (const camera of state.cameras) {
    updateCamera(camera, dt, state.time);
    if (cameraSeesThief(camera, state.thief, state.solids)) cameraSees = true;
  }

  // Holds: loot, carts, doors, consoles, keycard.
  if (axes.interact) {
    const hold = findHoldTarget(state.thief, state.level, state.guards);
    if (hold && hold.kind === 'locked') {
      flash('That door needs a keycard — lift it off a guard\'s belt.', 1.4);
      state.thief.holdTarget = null;
      holdGraceLeft = 0;
    } else if (hold) {
      holdGraceLeft = 0.4;
      if (progressHold(state.thief, hold, dt) === 'done') {
        const event = applyHold(state.thief, hold, state.level, state.guards, state.cameras);
        refreshSolids(state);
        if (event === 'loot') {
          playLoot(sound);
          state.alarm.value = Math.max(state.alarm.value, 30);
          spawnExtraGuard();
          flash('AURUM SECURED — GET OUT!', 2.5);
        } else if (event === 'cart') {
          playLoot(sound);
          flash('Cash cart emptied.', 1.6);
        } else if (event === 'door') {
          playPick(sound);
          flash('Door open — a new route.', 1.6);
        } else if (event === 'console') {
          playPick(sound);
          flash('Camera feed looped for 12 seconds.', 1.8);
        } else if (event === 'keycard') {
          playPick(sound);
          flash('Keycard lifted. The anteroom is yours.', 2);
        }
      }
    } else if (holdGraceLeft > 0) {
      // Briefly lost the target (a guard walked on): keep the progress.
      holdGraceLeft -= dt;
    } else if (!state.keepHold) {
      // A staged scene keeps its hold ring up for the screenshot.
      state.thief.holdTarget = null;
    }
  } else if (!state.keepHold) {
    state.thief.holdTarget = null;
    holdGraceLeft = 0;
  }

  // The alarm: guards first, then cameras, then lasers.
  const seen = guardSees ? 'guard' : cameraSees ? 'camera' : thiefInLaser() ? 'laser' : null;
  if (seen === 'laser') playLaser(sound);
  const alarmEvent = updateAlarm(state.alarm, dt, seen, state.thief);
  if (alarmEvent === 'spotted') {
    playSpotted(sound);
  } else if (alarmEvent === 'busted') {
    failNight();
    return;
  }
  // Alarm ticks accelerate as the meter fills.
  if (state.alarm.value >= 20) {
    tickTimer -= dt;
    const interval = state.alarm.value >= 75 ? 0.35 : state.alarm.value >= 45 ? 0.7 : 1.4;
    if (tickTimer <= 0) {
      tickTimer = interval;
      playTick(sound);
    }
  }

  // Extraction: loot in hand, reach the door.
  if (state.thief.lootTaken) {
    const ex = state.level.extraction;
    if (Math.hypot(state.thief.x - ex.x, state.thief.y - ex.y) < ex.r) {
      finishLevel();
    }
  }
}

function update(dt) {
  if (screen === SCREEN_TITLE) {
    if (wasPressed(input, KEYS.start)) startNight();
  } else if (screen === SCREEN_PLAY) {
    if (wasPressed(input, KEYS.restart)) {
      startLevel(state.levelIndex);
    } else {
      updatePlay(dt);
    }
  } else if (screen === SCREEN_BUSTED) {
    if (wasPressed(input, KEYS.restart)) startNight();
  } else if (screen === SCREEN_LEVEL_CLEAR) {
    if (wasPressed(input, KEYS.start)) startLevel(state.levelIndex + 1);
  } else if (screen === SCREEN_WIN) {
    if (wasPressed(input, KEYS.restart)) startNight();
  }
  consumePressed(input);
}

function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;
  update(dt);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (screen === SCREEN_BUSTED) drawBusted(ctx, state);
  else if (screen === SCREEN_LEVEL_CLEAR) drawLevelClear(ctx, state);
  else if (screen === SCREEN_WIN) drawWin(ctx, state);
  else drawGame(ctx, state, state.time);
  requestAnimationFrame(frame);
}

function resize() {
  const scale = Math.min(window.innerWidth / ROOM.width, window.innerHeight / ROOM.height);
  canvas.style.width = `${Math.floor(ROOM.width * scale)}px`;
  canvas.style.height = `${Math.floor(ROOM.height * scale)}px`;
}

window.addEventListener('resize', resize);
resize();

// The ?shot= scenes stage a deterministic frame for screenshots; the game
// itself never reads them.
if (shotName) {
  const staged = stageShot(shotName, state, seed);
  screen = staged.screen;
  state = staged.state;
  setStatus(`Screenshot scene: ${shotName}`);
}

// A test-only hook: the play-test drives the real mechanics through it
// (teleport, then hold F by dispatching real key events).
window.__vaultfall = {
  state: () => state,
  screen: () => screen,
  start: () => startNight(),
  startLevel: (index) => startLevel(index),
  teleport: (x, y) => {
    state.thief.x = x;
    state.thief.y = y;
  },
  setAlarm: (value) => {
    state.alarm.value = value;
  },
  completeLevel: () => {
    state.thief.lootTaken = true;
    state.thief.lootValue += state.level.loot.value;
    state.thief.x = state.level.extraction.x;
    state.thief.y = state.level.extraction.y;
  },
};

if (devWin) {
  startNight();
}

requestAnimationFrame(frame);
