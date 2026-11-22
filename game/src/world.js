// The room itself: walls and cover as rectangles, the geometry questions the
// rest of the game asks — can this circle move here, can this eye see that
// point, how loud was that step — and the shared noise events guards hear.
import { ROOM } from './config.js';

/** A rectangle: { x, y, w, h }. Walls block movement and sight; cover blocks
 *  sight and movement too, but reads as furniture the thief hides behind. */
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Does a circle at (x, y) with radius r touch a rectangle? */
export function circleHitsRect(x, y, r, rect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < r * r;
}

/** Push a circle out of every rectangle it overlaps; returns the corrected position. */
export function resolveCircle(x, y, r, solids) {
  let px = clamp(x, r, ROOM.width - r);
  let py = clamp(y, r, ROOM.height - r);
  for (const rect of solids) {
    if (!circleHitsRect(px, py, r, rect)) continue;
    const nearestX = clamp(px, rect.x, rect.x + rect.w);
    const nearestY = clamp(py, rect.y, rect.y + rect.h);
    let dx = px - nearestX;
    let dy = py - nearestY;
    let dist = Math.hypot(dx, dy);
    if (dist === 0) {
      // Centre inside the rectangle: shove out along the shallowest side.
      const left = px - rect.x;
      const right = rect.x + rect.w - px;
      const top = py - rect.y;
      const bottom = rect.y + rect.h - py;
      const smallest = Math.min(left, right, top, bottom);
      if (smallest === left) px = rect.x - r;
      else if (smallest === right) px = rect.x + rect.w + r;
      else if (smallest === top) py = rect.y - r;
      else py = rect.y + rect.h + r;
      continue;
    }
    dx /= dist;
    dy /= dist;
    dist = r - dist;
    px += dx * dist;
    py += dy * dist;
  }
  return { x: clamp(px, r, ROOM.width - r), y: clamp(py, r, ROOM.height - r) };
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment cross the rectangle's x/y slabs together?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when no wall or cover rectangle stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/** Angle difference wrapped to [-PI, PI]. */
export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is `point` inside a vision cone from `eye` facing `angle`? */
export function insideCone(eye, angle, range, halfAngle, point, solids) {
  const dx = point.x - eye.x;
  const dy = point.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return false;
  if (Math.abs(angleDelta(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return hasLineOfSight(eye.x, eye.y, point.x, point.y, solids);
}

/** A noise event: a point, a radius, and what made it. Guards inside the
 *  radius turn toward it; a coin landing is the one the thief wants heard. */
export function makeNoise(kind, x, y, radius) {
  return { kind, x, y, radius, age: 0 };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
