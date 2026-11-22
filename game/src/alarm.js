// The alarm meter: the night's tension in one number. It fills when the
// thief is seen, decays when unseen, and at 100 the heist is over — after
// a short, fair "SPOTTED!" freeze that shows exactly what saw you.
import { ALARM, CAMERA, GUARD } from './config.js';

export function makeAlarm() {
  return {
    value: 0,
    spottedFreezeLeft: 0,
    spottedBy: null, // 'guard' | 'camera' | 'laser' — what filled it
    everSpotted: false,
    peak: 0,
  };
}

/**
 * Advance the meter one step. `seen` names who sees the thief right now
 * (null when nobody does). Returns 'busted' the moment the meter fills.
 */
export function updateAlarm(alarm, dt, seen, thief) {
  if (alarm.spottedFreezeLeft > 0) {
    alarm.spottedFreezeLeft -= dt;
    if (alarm.spottedFreezeLeft <= 0) return 'busted';
    return null;
  }
  const floor = thief.lootTaken ? ALARM.lootGrabFloor : 0;
  if (seen === 'guard') {
    alarm.value = Math.min(100, alarm.value + ALARM.guardSeenPerSecond * dt);
  } else if (seen === 'camera') {
    alarm.value = Math.min(100, alarm.value + ALARM.cameraSeenPerSecond * dt);
  } else if (seen === 'laser') {
    alarm.value = Math.min(100, alarm.value + ALARM.laserPerSecond * dt);
  } else {
    alarm.value = Math.max(floor, alarm.value - ALARM.decayPerSecond * dt);
  }
  if (alarm.value < floor) alarm.value = floor;
  alarm.peak = Math.max(alarm.peak, alarm.value);
  if (alarm.value >= 100) {
    alarm.spottedBy = seen ?? 'guard';
    alarm.everSpotted = true;
    alarm.spottedFreezeLeft = ALARM.spottedFreezeSeconds;
    return 'spotted';
  }
  return null;
}

/** The meter's colour band: calm teal, then amber, then red as it fills. */
export function alarmBand(value) {
  if (value >= 75) return 'red';
  if (value >= 45) return 'amber';
  return 'teal';
}

/** How fast the alarm ticks should sound at this meter value. */
export function alarmTickInterval(value) {
  if (value >= 75) return 0.35;
  if (value >= 45) return 0.7;
  if (value >= 20) return 1.4;
  return Infinity;
}

export function guardSuspicionRate() {
  return GUARD.suspicionPerSecond;
}

export function cameraDetectRate() {
  return CAMERA.detectPerSecond;
}
