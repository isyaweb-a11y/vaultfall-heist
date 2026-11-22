// Wren, the thief: movement, sneak, and the three tools — coin, EMP,
// lockpick — plus the holds that lift loot, crack the vault, hack a console
// and pick a keycard off a guard's belt.
import { ALARM, GUARD, THIEF, TOOLS } from './config.js';
import { distance, makeNoise, resolveCircle } from './world.js';

export function makeThief(entrance) {
  return {
    x: entrance.x,
    y: entrance.y,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    inVent: false,
    coins: TOOLS.coinsStart,
    empCharge: 100,
    empActiveLeft: 0,
    hasKeycard: false,
    lootValue: 0,
    lootTaken: false,
    cartsTaken: 0,
    holdTarget: null, // { kind, progress, seconds, label }
    stepTimer: 0,
  };
}

/** Move the thief one step from the input axes; returns the noise made. */
export function moveThief(thief, input, dt, solids) {
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
  const ventSpeed = thief.inVent ? speed * 0.45 : speed;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.moving = dx !== 0 || dy !== 0;
  if (!thief.moving) return null;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const nx = thief.x + dx * ventSpeed * dt;
  const ny = thief.y + dy * ventSpeed * dt;
  const fixed = resolveCircle(nx, ny, THIEF.radius, solids);
  thief.x = fixed.x;
  thief.y = fixed.y;
  thief.angle = Math.atan2(dy, dx);
  // Footsteps are the noise guards hear: loud when running, a whisper when sneaking.
  thief.stepTimer -= dt;
  if (thief.stepTimer <= 0) {
    thief.stepTimer = thief.sneaking ? 0.55 : 0.34;
    const radius = thief.sneaking ? THIEF.noiseSneak : THIEF.noiseWalk;
    return makeNoise('footstep', thief.x, thief.y, radius);
  }
  return null;
}

/** Toss a coin toward a floor point. Returns the coin or null when out of coins. */
export function tossCoin(thief, x, y) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  return { x, y, age: 0, radius: GUARD.coinEarshot, kind: 'coin' };
}

/** Fire the EMP: cameras go dark, the meter jumps a little, battery drains. */
export function fireEmp(thief) {
  if (thief.empCharge < TOOLS.empCost) return false;
  thief.empCharge -= TOOLS.empCost;
  thief.empActiveLeft = TOOLS.empDurationSeconds;
  return true;
}

/** Recharge the EMP battery slowly while it is not firing. */
export function rechargeEmp(thief, dt) {
  if (thief.empActiveLeft <= 0) {
    thief.empCharge = Math.min(100, thief.empCharge + 5 * dt);
  } else {
    thief.empActiveLeft -= dt;
  }
}

/**
 * What the thief can hold F on right now, nearest first:
 * loot, a cash cart, a locked door, a camera console, a keycard guard's belt.
 * Returns { kind, label, seconds, target } or null.
 */
export function findHoldTarget(thief, level, guards) {
  const reach = 52;
  // The big loot: lift the case, crack the vault.
  if (!thief.lootTaken && distance(thief, level.loot) <= reach + level.loot.r) {
    return {
      kind: level.loot.kind === 'vault' ? 'vault' : 'loot',
      label: level.loot.kind === 'vault' ? 'CRACK THE VAULT' : 'LIFT THE CASE',
      seconds: level.loot.kind === 'vault' ? TOOLS.vaultCrackSeconds : TOOLS.lootLiftSeconds,
      target: level.loot,
    };
  }
  // Optional cash carts.
  for (const cart of level.extraLoot ?? []) {
    if (!cart.taken && distance(thief, cart) <= reach + cart.r) {
      return { kind: 'cart', label: 'EMPTY THE CART', seconds: TOOLS.lootLiftSeconds, target: cart };
    }
  }
  // Locked doors: pick the lock, or open with the keycard.
  for (const door of level.doors) {
    if (!door.locked) continue;
    const cx = door.x + door.w / 2;
    const cy = door.y + door.h / 2;
    if (Math.hypot(thief.x - cx, thief.y - cy) <= reach + 30) {
      if (door.keycard && thief.hasKeycard) {
        return { kind: 'keydoor', label: 'UNLOCK WITH KEYCARD', seconds: 0.6, target: door };
      }
      if (!door.keycard) {
        return { kind: 'lockpick', label: 'PICK THE LOCK', seconds: TOOLS.lockpickSeconds, target: door };
      }
      return { kind: 'locked', label: 'NEEDS A KEYCARD', seconds: 0, target: door };
    }
  }
  // Camera consoles: hold to loop the feed.
  for (const consoleDef of level.consoles ?? []) {
    if (distance(thief, consoleDef) <= reach) {
      return { kind: 'console', label: 'HACK THE CONSOLE', seconds: 3.0, target: consoleDef };
    }
  }
  // The keycard, on a guard's belt: brush past from behind.
  const keyGuard = level.keycardGuard >= 0 ? guards[level.keycardGuard] : null;
  if (keyGuard && !thief.hasKeycard) {
    const behind = Math.abs(
      ((Math.atan2(thief.y - keyGuard.y, thief.x - keyGuard.x) - keyGuard.angle + Math.PI * 3) %
        (Math.PI * 2)) -
        Math.PI,
    );
    if (distance(thief, keyGuard) <= GUARD.pickpocketRange && behind < 1.1) {
      return { kind: 'pickpocket', label: 'LIFT THE KEYCARD', seconds: GUARD.pickpocketSeconds, target: keyGuard };
    }
  }
  return null;
}

/** Advance the current hold; returns 'done' when it completes, else null. */
export function progressHold(thief, hold, dt) {
  if (!hold) return null;
  if (!thief.holdTarget || thief.holdTarget.kind !== hold.kind) {
    thief.holdTarget = { kind: hold.kind, progress: 0, seconds: hold.seconds, label: hold.label };
  }
  thief.holdTarget.progress += dt;
  if (thief.holdTarget.progress >= hold.seconds) {
    thief.holdTarget = null;
    return 'done';
  }
  return null;
}

/** Apply a finished hold to the world. Returns a short event name for the log. */
export function applyHold(thief, hold, level, guards, cameras) {
  switch (hold.kind) {
    case 'loot':
    case 'vault': {
      thief.lootTaken = true;
      thief.lootValue += level.loot.value;
      return 'loot';
    }
    case 'cart': {
      hold.target.taken = true;
      thief.cartsTaken += 1;
      thief.lootValue += hold.target.value;
      return 'cart';
    }
    case 'lockpick':
    case 'keydoor': {
      hold.target.locked = false;
      return 'door';
    }
    case 'console': {
      const camera = cameras[hold.target.cameraIndex];
      if (camera) camera.loopedLeft = 12;
      return 'console';
    }
    case 'pickpocket': {
      thief.hasKeycard = true;
      return 'keycard';
    }
    default:
      return null;
  }
}

export function thiefAlarmFloor(thief) {
  return thief.lootTaken ? ALARM.lootGrabFloor : 0;
}
