// A fresh level state: the room data copied (so locks and loot reset),
// live guards and cameras built from it, a fresh thief and alarm.
import { LEVELS, solidsOf } from './levels.js';
import { makeGuard } from './guards.js';
import { makeCamera } from './cameras.js';
import { makeThief } from './thief.js';
import { makeAlarm } from './alarm.js';
import { makeRng } from './random.js';

export function buildLevelState(levelIndex, seed) {
  const def = LEVELS[levelIndex];
  // Deep-copy the room so a run never mutates the shared level data.
  const level = JSON.parse(JSON.stringify(def));
  const guards = level.guards.map((guardDef, index) => makeGuard(guardDef, index));
  if (level.keycardGuard >= 0 && guards[level.keycardGuard]) {
    guards[level.keycardGuard].hasKeycard = true;
  }
  const cameras = level.cameras.map((cameraDef, index) => makeCamera(cameraDef, index));
  const rng = makeRng(seed ?? 1234);
  return {
    levelIndex,
    level,
    guards,
    cameras,
    thief: makeThief(level.entrance),
    alarm: makeAlarm(),
    solids: solidsOf(level),
    coins: [],
    ripples: [],
    noises: [],
    time: 0,
    levelTime: 0,
    score: 0,
    levelScore: 0,
    totalScore: 0,
    grade: '—',
    extraGuardSpawned: false,
    flashText: null,
    flashLeft: 0,
    rng,
  };
}

/** Recompute the solids after a door opens or closes. */
export function refreshSolids(state) {
  state.solids = solidsOf(state.level);
}
