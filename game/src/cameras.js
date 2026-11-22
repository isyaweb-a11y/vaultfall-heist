// The camera posts: fixed, sweeping, cyan, and hackable. A camera that
// watches the thief fills the meter slowly; a hacked one loops its feed
// and sees nothing for a while.
import { CAMERA } from './config.js';
import { angleDelta, insideCone } from './world.js';

export function makeCamera(def, index) {
  return {
    index,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    label: def.label ?? `CAM ${index + 1}`,
    sweepPhase: index * 1.7, // posts start out of phase with each other
    angle: def.baseAngle,
    disabledLeft: 0, // EMP: sees nothing while this counts down
    loopedLeft: 0, // hacked console: sees nothing while this counts down
    hackProgress: 0,
  };
}

/** Advance one camera's sweep; returns nothing. */
export function updateCamera(camera, dt, time) {
  camera.angle =
    camera.baseAngle +
    Math.sin(time * CAMERA.sweepSpeed + camera.sweepPhase) * CAMERA.sweepArc;
  if (camera.disabledLeft > 0) camera.disabledLeft -= dt;
  if (camera.loopedLeft > 0) camera.loopedLeft -= dt;
}

export function cameraIsBlind(camera) {
  return camera.disabledLeft > 0 || camera.loopedLeft > 0;
}

/** Does this camera see the thief this frame? */
export function cameraSeesThief(camera, thief, solids) {
  if (cameraIsBlind(camera)) return false;
  return insideCone(camera, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, thief, solids);
}

/** A camera cone's tint: cyan while watching, grey while blind. */
export function cameraConeColor(camera) {
  return cameraIsBlind(camera) ? 'grey' : 'cyan';
}

/** How far the sweep has turned, for the renderer's little sweeping head. */
export function cameraSweepOffset(camera, time) {
  return Math.sin(time * CAMERA.sweepSpeed + camera.sweepPhase) * CAMERA.sweepArc;
}

export function cameraAngleDelta(camera, targetAngle) {
  return angleDelta(targetAngle, camera.angle);
}
