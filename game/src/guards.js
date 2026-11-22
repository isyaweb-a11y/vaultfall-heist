// The patrol: waypoint loops, look-arounds, suspicion, and the question
// every guard asks each frame — can I see the thief right now?
import { GUARD } from './config.js';
import { angleDelta, distance, hasLineOfSight, insideCone, resolveCircle } from './world.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_RETURN = 'return';

/** Build a live guard from a level-data entry. */
export function makeGuard(def, index) {
  const first = def.waypoints[0];
  return {
    index,
    name: def.name,
    x: first[0],
    y: first[1],
    angle: 0,
    waypoints: def.waypoints,
    waypointIndex: 1,
    pause: def.pause ?? 1.2,
    pauseLeft: 0,
    speed: def.speed ?? GUARD.patrolSpeed,
    fast: !!def.fast,
    state: GUARD_PATROL,
    suspicion: 0,
    investigateX: 0,
    investigateY: 0,
    investigateLeft: 0,
    lookTimer: 0,
    lookBase: 0,
    hasKeycard: false,
    spotted: false,
  };
}

/** The cone a guard actually sees with right now: shorter against a sneaking thief. */
export function guardConeRange(guard, thiefSneaking) {
  return thiefSneaking ? GUARD.sneakConeRange : GUARD.coneRange;
}

/** Does this guard see the thief this frame? Walls and cover break the view. */
export function guardSeesThief(guard, thief, solids) {
  const range = guardConeRange(guard, thief.sneaking);
  return insideCone(guard, guard.angle, range, GUARD.coneHalfAngle, thief, solids);
}

/** Turn toward `angle` at most `rate` radians this step; returns the new angle. */
export function turnToward(angle, target, rate) {
  const d = angleDelta(target, angle);
  if (Math.abs(d) <= rate) return target;
  return angle + Math.sign(d) * rate;
}

function stepToward(guard, tx, ty, speed, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Guards slide along walls like the thief does.
  const fixed = resolveCircle(nx, ny, 14, solids);
  guard.x = fixed.x;
  guard.y = fixed.y;
  guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 6 * dt);
  return dist <= step + 0.5;
}

/**
 * Advance one guard one step. Returns an event string when something worth
 * announcing happened: 'spotted' when suspicion first maxes out.
 */
export function updateGuard(guard, dt, ctx) {
  const { thief, solids, noises, time } = ctx;
  const sees = guardSeesThief(guard, thief, solids);

  if (sees) {
    guard.suspicion = Math.min(
      GUARD.spotThreshold,
      guard.suspicion + GUARD.suspicionPerSecond * dt,
    );
    if (guard.suspicion >= GUARD.spotThreshold && !guard.spotted) {
      guard.spotted = true;
      guard.state = GUARD_SUSPICIOUS;
      return 'spotted';
    }
    if (guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecayPerSecond * dt);
    if (guard.spotted && guard.suspicion <= 0) guard.spotted = false;
    if (guard.state === GUARD_SUSPICIOUS && guard.suspicion <= 0) {
      guard.state = GUARD_PATROL;
    }
  }

  // A noise inside earshot pulls a patrolling guard over to look.
  if (guard.state === GUARD_PATROL) {
    for (const noise of noises) {
      if (distance(guard, noise) <= noise.radius) {
        guard.state = GUARD_INVESTIGATE;
        guard.investigateX = noise.x;
        guard.investigateY = noise.y;
        guard.investigateLeft = GUARD.coinDistractSeconds;
        break;
      }
    }
  }

  switch (guard.state) {
    case GUARD_PATROL: {
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        // Look around while paused: sweep the head side to side.
        guard.lookTimer += dt;
        guard.angle =
          guard.lookBase + Math.sin(guard.lookTimer * 1.8) * 0.9;
        if (guard.pauseLeft <= 0) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        }
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      const arrived = stepToward(guard, target[0], target[1], guard.speed, dt, solids);
      if (arrived) {
        guard.pauseLeft = guard.pause;
        guard.lookTimer = 0;
        guard.lookBase = guard.angle;
      }
      break;
    }
    case GUARD_SUSPICIOUS: {
      // Locked on: turn to face the thief and close in slowly.
      guard.angle = turnToward(guard.angle, Math.atan2(thief.y - guard.y, thief.x - guard.x), 5 * dt);
      if (sees) {
        stepToward(guard, thief.x, thief.y, guard.speed * 0.7, dt, solids);
      }
      break;
    }
    case GUARD_INVESTIGATE: {
      const arrived = stepToward(
        guard,
        guard.investigateX,
        guard.investigateY,
        GUARD.investigateSpeed,
        dt,
        solids,
      );
      if (arrived) {
        guard.investigateLeft -= dt;
        guard.lookTimer += dt;
        guard.angle = guard.lookBase + Math.sin(guard.lookTimer * 2.4) * 1.1;
        if (guard.investigateLeft <= 0) {
          guard.state = GUARD_RETURN;
          guard.lookBase = guard.angle;
        }
      } else {
        guard.lookBase = guard.angle;
      }
      break;
    }
    case GUARD_RETURN: {
      // Walk back to the nearest waypoint, then resume the loop.
      let nearest = 0;
      let nearestDist = Infinity;
      guard.waypoints.forEach((point, i) => {
        const d = Math.hypot(point[0] - guard.x, point[1] - guard.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      const target = guard.waypoints[nearest];
      const arrived = stepToward(guard, target[0], target[1], guard.speed, dt, solids);
      if (arrived) {
        guard.waypointIndex = nearest;
        guard.state = GUARD_PATROL;
        guard.pauseLeft = guard.pause;
        guard.lookTimer = 0;
        guard.lookBase = guard.angle;
      }
      break;
    }
    default:
      break;
  }
  void time;
  return null;
}

/** Guard cone colour by state: amber when calm, orange when suspicious, red when locked on. */
export function guardConeColor(guard) {
  if (guard.spotted || guard.suspicion >= GUARD.spotThreshold) return 'red';
  if (guard.state === GUARD_SUSPICIOUS || guard.suspicion > 25) return 'orange';
  return 'amber';
}
