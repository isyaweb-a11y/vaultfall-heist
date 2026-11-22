// Vaultfall tuning: every number that shapes how the heist feels lives here,
// so a balance pass touches one file and nothing else.
export const ROOM = { width: 1280, height: 800 };

export const THIEF = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 118,
  noiseWalk: 95,
  noiseSneak: 34,
  noiseRun: 150,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 82,
  fastPatrolSpeed: 128,
  investigateSpeed: 150,
  chaseSpeed: 185,
  coneRange: 235,
  coneHalfAngle: 0.61, // ~35 degrees each side
  sneakConeRange: 165, // cones read shorter against a sneaking thief
  lookAroundSeconds: 1.6,
  suspicionPerSecond: 55,
  suspicionDecayPerSecond: 30,
  spotThreshold: 100,
  coinEarshot: 260,
  coinDistractSeconds: 3.0,
  pickpocketRange: 56,
  pickpocketSeconds: 1.0,
};

export const CAMERA = {
  radius: 10,
  coneRange: 300,
  coneHalfAngle: 0.34, // narrow, long
  sweepSpeed: 0.55, // radians per second of the sweep centre
  sweepArc: 0.85, // radians each side of the base angle
  detectPerSecond: 16,
  hackSeconds: 3.0,
  loopSeconds: 12,
};

export const ALARM = {
  guardSeenPerSecond: 26,
  cameraSeenPerSecond: 13,
  laserPerSecond: 34,
  decayPerSecond: 9,
  empSpike: 6,
  lootGrabFloor: 30, // grabbing the loot locks the meter at least here
  spottedFreezeSeconds: 0.8,
};

export const TOOLS = {
  coinsStart: 3,
  empCost: 40,
  empDurationSeconds: 6,
  empRefillPerSecond: 5,
  lockpickSeconds: 2.5,
  lootLiftSeconds: 1.5,
  vaultCrackSeconds: 4.0,
};

export const LASER = {
  cycleSeconds: 3.2, // on for half the cycle, off for half
  onFraction: 0.5,
};

export const SCORE = {
  lootValue: 5000,
  cartValue: 1500,
  timeBonusPerSecond: 25,
  ghostBonus: 2000,
  gradeS: 9000,
  gradeA: 7000,
  gradeB: 5000,
};

export const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sneak: ['ShiftLeft', 'ShiftRight'],
  coin: ['KeyQ'],
  emp: ['KeyE'],
  interact: ['KeyF'],
  mute: ['KeyM'],
  restart: ['KeyR'],
  start: ['Enter', 'Space'],
};
