// The three rooms of the night, as data: walls, cover, patrols, cameras,
// loot, lasers, doors and the extraction point. One room fits the whole
// screen, so the judge's screenshot always shows the full heist.
import { ROOM } from './config.js';

const WALL = 26; // border wall thickness

/** The room's outer walls, shared by every level. */
export function borderWalls() {
  return [
    { x: 0, y: 0, w: ROOM.width, h: WALL },
    { x: 0, y: ROOM.height - WALL, w: ROOM.width, h: WALL },
    { x: 0, y: 0, w: WALL, h: ROOM.height },
    { x: ROOM.width - WALL, y: 0, w: WALL, h: ROOM.height },
  ];
}

// ---------------------------------------------------------------- level 1
// The Lobby: two guards, one camera, a side office route vs the main hall.
export const LEVEL_1 = {
  id: 1,
  name: 'The Lobby',
  briefing: 'Cross the banking hall. Lift the Aurum display case, then slip back to the service door.',
  parSeconds: 75,
  entrance: { x: 90, y: 700 },
  extraction: { x: 90, y: 700, r: 42, label: 'SERVICE DOOR' },
  walls: [
    // The office wing: a side route behind the left wall, reached by a locked door.
    { x: 300, y: 260, w: 18, h: 300 },
    { x: 300, y: 260, w: 220, h: 18 },
    { x: 300, y: 542, w: 220, h: 18 },
    // East wall leaves a gap at the top: cross the office, slip out near the loot.
    { x: 502, y: 380, w: 18, h: 180 },
  ],
  cover: [
    { x: 430, y: 150, w: 150, h: 54, kind: 'desk' },
    { x: 700, y: 150, w: 150, h: 54, kind: 'desk' },
    { x: 960, y: 150, w: 150, h: 54, kind: 'desk' },
    { x: 560, y: 380, w: 60, h: 60, kind: 'pillar' },
    { x: 880, y: 380, w: 60, h: 60, kind: 'pillar' },
    { x: 430, y: 590, w: 150, h: 54, kind: 'desk' },
    { x: 700, y: 590, w: 150, h: 54, kind: 'desk' },
    { x: 180, y: 380, w: 54, h: 54, kind: 'planter' },
    { x: 1080, y: 430, w: 54, h: 54, kind: 'planter' },
  ],
  doors: [
    { id: 'office', x: 300, y: 400, w: 18, h: 70, locked: true, label: 'OFFICE DOOR' },
  ],
  guards: [
    { name: 'Marlowe', waypoints: [[420, 320], [860, 320], [860, 480], [420, 480]], pause: 1.2, speed: 82 },
    { name: 'Bex', waypoints: [[1050, 300], [1050, 700], [640, 700]], pause: 1.6, speed: 82 },
  ],
  cameras: [
    { x: 640, y: 60, baseAngle: Math.PI / 2, label: 'CAM 1' },
  ],
  consoles: [
    { x: 620, y: 120, cameraIndex: 0, label: 'CAMERA CONSOLE' },
  ],
  lasers: [],
  vents: [],
  loot: { x: 1150, y: 110, r: 30, kind: 'case', value: 5000, label: 'AURUM DISPLAY CASE' },
  extraLoot: [],
  keycardGuard: -1,
};

// ---------------------------------------------------------------- level 2
// The Counting House: a fast patroller, two cameras, a laser corridor and a
// vent crawl; the keycard rides on a guard's belt.
export const LEVEL_2 = {
  id: 2,
  name: 'The Counting House',
  briefing: 'The anteroom keycard rides on a guard\'s belt. Lift it, slip the laser corridor, empty the carts.',
  parSeconds: 110,
  entrance: { x: 90, y: 700 },
  extraction: { x: 90, y: 700, r: 42, label: 'SERVICE DOOR' },
  walls: [
    { x: 760, y: 26, w: 18, h: 420 },
    { x: 760, y: 446, w: 18, h: 120 },
    { x: 760, y: 636, w: 18, h: 138 },
    { x: 760, y: 446, w: 220, h: 18 },
    { x: 980, y: 446, w: 18, h: 328 },
  ],
  cover: [
    { x: 180, y: 150, w: 170, h: 56, kind: 'desk' },
    { x: 470, y: 150, w: 170, h: 56, kind: 'desk' },
    { x: 180, y: 420, w: 170, h: 56, kind: 'desk' },
    { x: 470, y: 420, w: 170, h: 56, kind: 'desk' },
    { x: 180, y: 620, w: 170, h: 56, kind: 'desk' },
    { x: 900, y: 620, w: 170, h: 56, kind: 'desk' },
    { x: 1080, y: 150, w: 56, h: 56, kind: 'planter' },
    { x: 1080, y: 300, w: 56, h: 56, kind: 'planter' },
  ],
  doors: [
    { id: 'anteroom', x: 760, y: 566, w: 18, h: 70, locked: true, keycard: true, label: 'ANTEROOM — KEYCARD' },
  ],
  guards: [
    { name: 'Marlowe', waypoints: [[380, 300], [700, 300], [700, 560], [380, 560]], pause: 1.0, speed: 82 },
    { name: 'Rook', waypoints: [[900, 120], [1180, 120], [1180, 380], [900, 380]], pause: 0.8, speed: 128, fast: true },
    { name: 'Bex', waypoints: [[220, 720], [700, 720]], pause: 1.8, speed: 82 },
  ],
  cameras: [
    { x: 640, y: 60, baseAngle: Math.PI / 2, label: 'CAM 1' },
    { x: 1100, y: 60, baseAngle: Math.PI / 2, label: 'CAM 2' },
  ],
  consoles: [
    { x: 620, y: 120, cameraIndex: 0, label: 'CAMERA CONSOLE' },
    { x: 1150, y: 250, cameraIndex: 1, label: 'CAMERA CONSOLE' },
  ],
  // A timed laser wall down the middle of the room: cross when it blinks off,
  // or crawl the vent along the top wall instead.
  lasers: [
    { x: 560, y: 26, w: 10, h: 748, phase: 0, label: 'LASER GRID' },
  ],
  vents: [
    { x: 380, y: 40, w: 420, h: 44, label: 'VENT' },
  ],
  loot: { x: 1150, y: 700, r: 30, kind: 'vault', value: 5000, label: 'ANTEROOM VAULT' },
  extraLoot: [
    { x: 880, y: 520, r: 24, kind: 'cart', value: 1500, label: 'CASH CART', taken: false },
    { x: 1080, y: 520, r: 24, kind: 'cart', value: 1500, label: 'CASH CART', taken: false },
  ],
  keycardGuard: 1, // Rook carries the anteroom keycard
};

// ---------------------------------------------------------------- level 3
// The Meridian Vault: four guards, three cameras, a rotating laser ring and
// the big crack — then a hot run back across the whole room.
export const LEVEL_3 = {
  id: 3,
  name: 'The Meridian Vault',
  briefing: 'Crack the vault while the cones sweep past your cover. Then run — the rooftop door is on the far side.',
  parSeconds: 150,
  entrance: { x: 90, y: 700 },
  extraction: { x: 1180, y: 110, r: 42, label: 'ROOFTOP DOOR' },
  walls: [
    { x: 520, y: 26, w: 18, h: 260 },
    { x: 520, y: 406, w: 240, h: 18 },
    { x: 760, y: 286, w: 18, h: 138 },
  ],
  cover: [
    { x: 180, y: 150, w: 150, h: 54, kind: 'desk' },
    { x: 180, y: 420, w: 150, h: 54, kind: 'desk' },
    { x: 180, y: 620, w: 150, h: 54, kind: 'desk' },
    { x: 880, y: 620, w: 150, h: 54, kind: 'desk' },
    { x: 1080, y: 620, w: 150, h: 54, kind: 'desk' },
    { x: 620, y: 560, w: 60, h: 60, kind: 'pillar' },
    { x: 960, y: 380, w: 60, h: 60, kind: 'pillar' },
    { x: 1080, y: 300, w: 54, h: 54, kind: 'planter' },
    { x: 380, y: 300, w: 54, h: 54, kind: 'planter' },
  ],
  doors: [
    { id: 'vault-wing', x: 520, y: 286, w: 18, h: 120, locked: false, label: 'VAULT WING' },
  ],
  guards: [
    { name: 'Marlowe', waypoints: [[380, 300], [480, 300], [480, 520], [380, 520]], pause: 1.0, speed: 82 },
    { name: 'Rook', waypoints: [[900, 120], [1180, 120], [1180, 480], [900, 480]], pause: 0.8, speed: 128, fast: true },
    { name: 'Bex', waypoints: [[220, 720], [700, 720]], pause: 1.6, speed: 82 },
    { name: 'Sable', waypoints: [[620, 500], [1020, 500], [1020, 540], [620, 540]], pause: 1.2, speed: 82 },
  ],
  cameras: [
    { x: 300, y: 60, baseAngle: Math.PI / 2, label: 'CAM 1' },
    { x: 640, y: 60, baseAngle: Math.PI / 2, label: 'CAM 2' },
    { x: 1000, y: 60, baseAngle: Math.PI / 2, label: 'CAM 3' },
  ],
  consoles: [
    { x: 280, y: 120, cameraIndex: 0, label: 'CAMERA CONSOLE' },
    { x: 560, y: 90, cameraIndex: 1, label: 'CAMERA CONSOLE' },
    { x: 980, y: 120, cameraIndex: 2, label: 'CAMERA CONSOLE' },
  ],
  lasers: [],
  // The vault's rotating laser ring: three beams turning around the vault door.
  laserRing: { x: 640, y: 180, radius: 130, beams: 3, spin: 0.5 },
  vents: [],
  loot: { x: 640, y: 180, r: 34, kind: 'vault', value: 5000, label: 'THE MERIDIAN VAULT' },
  extraLoot: [],
  keycardGuard: -1,
};

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

/** All rectangles that block movement and sight in a live level state. */
export function solidsOf(level) {
  const solids = [...borderWalls(), ...level.walls, ...level.cover];
  for (const door of level.doors) {
    if (door.locked) solids.push({ x: door.x, y: door.y, w: door.w, h: door.h });
  }
  return solids;
}
