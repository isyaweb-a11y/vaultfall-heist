// Every pixel of Vaultfall: the marble floor, the brass-trimmed cover, the
// vision cones raycast around the furniture, the glowing loot, the HUD with
// its chunky alarm meter, and the title / busted / win screens.
import { CAMERA, GUARD, LASER, ROOM } from './config.js';
import { circleHitsRect } from './world.js';
import { alarmBand } from './alarm.js';
import { cameraConeColor } from './cameras.js';
import { guardConeColor } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_LEVEL_CLEAR = 'level-clear';
export const SCREEN_WIN = 'win';

const INK = '#0d1526';
const INK_LIGHT = '#131f38';
const MARBLE = '#1a2947';
const BRASS = '#c9a227';
const BRASS_DIM = '#8a6d1f';
const TEAL = '#1d4a4a';
const TEAL_EDGE = '#2e7d7d';
const GOLD = '#ffd34d';
const CYAN = '#37e0e6';
const RED = '#ff4d4d';
const AMBER = '#ffb02e';
const ORANGE = '#ff7a1a';

function conePolygon(eye, angle, range, halfAngle, solids) {
  const points = [{ x: eye.x, y: eye.y }];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let reach = range;
    for (let d = 12; d <= range; d += 10) {
      const px = eye.x + dx * d;
      const py = eye.y + dy * d;
      if (solids.some((rect) => circleHitsRect(px, py, 2, rect))) {
        reach = d;
        break;
      }
    }
    points.push({ x: eye.x + dx * reach, y: eye.y + dy * reach });
  }
  return points;
}

function fillCone(ctx, eye, angle, range, halfAngle, solids, color, alpha) {
  const points = conePolygon(eye, angle, range, halfAngle, solids);
  const gradient = ctx.createRadialGradient(eye.x, eye.y, 8, eye.x, eye.y, range);
  gradient.addColorStop(0, colorWithAlpha(color, alpha));
  gradient.addColorStop(1, colorWithAlpha(color, alpha * 0.25));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(color, alpha * 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

export function colorWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawFloor(ctx, time) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  const tile = 64;
  for (let ty = 0; ty < ROOM.height / tile; ty += 1) {
    for (let tx = 0; tx < ROOM.width / tile; tx += 1) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = INK_LIGHT;
        ctx.fillRect(tx * tile, ty * tile, tile, tile);
      }
    }
  }
  // Marble inlay lines.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= ROOM.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ROOM.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROOM.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ROOM.width, y);
    ctx.stroke();
  }
  // Dust motes drifting in the dark.
  ctx.fillStyle = 'rgba(255, 220, 130, 0.25)';
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 173) % ROOM.width) + Math.sin(time * 0.3 + i) * 6;
    const y = ((i * 97) % ROOM.height) + Math.cos(time * 0.22 + i * 2) * 6;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawWalls(ctx, level) {
  ctx.fillStyle = '#060a14';
  for (const wall of [...level.walls]) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = BRASS_DIM;
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  }
  // Border walls with brass trim.
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, ROOM.width, 26);
  ctx.fillRect(0, ROOM.height - 26, ROOM.width, 26);
  ctx.fillRect(0, 0, 26, ROOM.height);
  ctx.fillRect(ROOM.width - 26, 0, 26, ROOM.height);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, ROOM.width - 52, ROOM.height - 52);
}

function drawCover(ctx, level) {
  for (const rect of level.cover) {
    if (rect.kind === 'pillar') {
      ctx.fillStyle = TEAL;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = '#274b63';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = BRASS;
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else if (rect.kind === 'planter') {
      ctx.fillStyle = '#123326';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = '#1e6b4a';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2 - 8, rect.y + rect.h / 2 - 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = BRASS_DIM;
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      // Desk: dark teal block, brass edge, papers on top.
      ctx.fillStyle = TEAL;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = BRASS;
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
      ctx.fillStyle = 'rgba(255, 255, 240, 0.16)';
      ctx.fillRect(rect.x + 14, rect.y + 10, 34, 22);
      ctx.fillRect(rect.x + rect.w - 52, rect.y + rect.h - 26, 30, 14);
    }
  }
}

function drawDoors(ctx, level) {
  for (const door of level.doors) {
    if (!door.locked) continue;
    ctx.fillStyle = door.keycard ? '#3a2a10' : '#2a2118';
    ctx.fillRect(door.x - 3, door.y - 3, door.w + 6, door.h + 6);
    ctx.strokeStyle = door.keycard ? GOLD : BRASS_DIM;
    ctx.lineWidth = 2;
    ctx.strokeRect(door.x - 3, door.y - 3, door.w + 6, door.h + 6);
    // A small brass padlock mark on the door.
    ctx.fillStyle = GOLD;
    ctx.fillRect(door.x + door.w / 2 - 3, door.y + door.h / 2 - 2, 6, 7);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(door.x + door.w / 2, door.y + door.h / 2 - 2, 4, Math.PI, 0);
    ctx.stroke();
  }
}

function drawVents(ctx, level) {
  for (const vent of level.vents ?? []) {
    ctx.fillStyle = 'rgba(46, 125, 125, 0.35)';
    ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
    ctx.strokeStyle = TEAL_EDGE;
    ctx.lineWidth = 1;
    for (let x = vent.x + 8; x < vent.x + vent.w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, vent.y + 6);
      ctx.lineTo(x, vent.y + vent.h - 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#bfe8e8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VENT — CRAWL', vent.x + 8, vent.y + vent.h / 2 + 3);
  }
}

function laserIsOn(time, phase) {
  const cycle = (time + phase) % LASER.cycleSeconds;
  return cycle < LASER.cycleSeconds * LASER.onFraction;
}

function drawLasers(ctx, level, time) {
  for (const laser of level.lasers ?? []) {
    const on = laserIsOn(time, laser.phase ?? 0);
    ctx.fillStyle = on ? 'rgba(255, 60, 60, 0.55)' : 'rgba(255, 60, 60, 0.08)';
    ctx.fillRect(laser.x - 3, laser.y, laser.w + 6, laser.h);
    if (on) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      for (let y = laser.y + 10; y < laser.y + laser.h; y += 26) {
        ctx.beginPath();
        ctx.moveTo(laser.x, y);
        ctx.lineTo(laser.x + laser.w, y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = on ? RED : '#7a2a2a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(on ? 'LASER — LIVE' : 'LASER — OFF', laser.x + laser.w / 2, laser.y - 8);
  }
  const ring = level.laserRing;
  if (ring) {
    const beams = ring.beams;
    for (let i = 0; i < beams; i += 1) {
      const a = time * ring.spin + (i * Math.PI * 2) / beams;
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ring.x + Math.cos(a) * 34, ring.y + Math.sin(a) * 34);
      ctx.lineTo(ring.x + Math.cos(a) * ring.radius, ring.y + Math.sin(a) * ring.radius);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawExtraction(ctx, level, active, time) {
  const ex = level.extraction;
  const pulse = 0.5 + Math.sin(time * 3) * 0.2;
  ctx.fillStyle = active ? `rgba(80, 255, 140, ${0.25 + pulse * 0.2})` : 'rgba(80, 255, 140, 0.08)';
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? '#50ff8c' : '#2a6b45';
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = active ? '#c9ffe0' : '#6a9a7d';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ex.label, ex.x, ex.y + ex.r + 16);
}

function drawLoot(ctx, level, time, taken) {
  const loot = level.loot;
  if (taken) return;
  const glow = 0.5 + Math.sin(time * 2.2) * 0.25;
  const gradient = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 90);
  gradient.addColorStop(0, `rgba(255, 211, 77, ${0.55 + glow * 0.3})`);
  gradient.addColorStop(1, 'rgba(255, 211, 77, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 90, 0, Math.PI * 2);
  ctx.fill();
  // The gold ingot stack.
  ctx.fillStyle = GOLD;
  ctx.fillRect(loot.x - 22, loot.y - 6, 44, 14);
  ctx.fillStyle = '#ffe9a3';
  ctx.fillRect(loot.x - 16, loot.y - 18, 32, 12);
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(loot.x - 22, loot.y + 8, 44, 4);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.strokeRect(loot.x - 30, loot.y - 24, 60, 40);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.label, loot.x, loot.y - 40);
  for (const cart of level.extraLoot ?? []) {
    if (cart.taken) continue;
    ctx.fillStyle = '#3fae6a';
    ctx.fillRect(cart.x - 18, cart.y - 12, 36, 24);
    ctx.fillStyle = '#b8ffd0';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('$', cart.x, cart.y + 4);
    ctx.fillStyle = '#b8ffd0';
    ctx.fillText(cart.label, cart.x, cart.y - 22);
  }
}

function drawConsoles(ctx, level, cameras) {
  for (const consoleDef of level.consoles ?? []) {
    const camera = cameras[consoleDef.cameraIndex];
    const looped = camera && camera.loopedLeft > 0;
    ctx.fillStyle = looped ? '#1d4a2a' : '#1d3a4a';
    ctx.fillRect(consoleDef.x - 14, consoleDef.y - 10, 28, 20);
    ctx.strokeStyle = looped ? '#50ff8c' : CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(consoleDef.x - 14, consoleDef.y - 10, 28, 20);
    ctx.fillStyle = looped ? '#50ff8c' : CYAN;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(looped ? 'LOOPED' : 'HACK', consoleDef.x, consoleDef.y + 24);
  }
}

function drawGuards(ctx, guards, solids, time) {
  for (const guard of guards) {
    const range = GUARD.coneRange;
    const color =
      guardConeColor(guard) === 'red' ? RED : guardConeColor(guard) === 'orange' ? ORANGE : AMBER;
    fillCone(ctx, guard, guard.angle, range, GUARD.coneHalfAngle, solids, color, guard.spotted ? 0.5 : 0.32);
  }
  for (const guard of guards) {
    // Body: dark uniform with a brass belt; keycard glints gold on the belt.
    ctx.fillStyle = '#2b3a55';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d7e3f4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x - 9, guard.y + 4);
    ctx.lineTo(guard.x + 9, guard.y + 4);
    ctx.stroke();
    if (guard.hasKeycard) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(guard.x + 4, guard.y + 1, 8, 6);
    }
    // Facing tick + a small torch dot.
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.angle) * (GUARD.radius + 4), guard.y + Math.sin(guard.angle) * (GUARD.radius + 4), 3, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion: "?" above the head, "!" when locked on.
    if (guard.suspicion > 25 || guard.spotted) {
      ctx.fillStyle = guard.spotted ? RED : AMBER;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.spotted ? '!' : '?', guard.x, guard.y - GUARD.radius - 8);
    }
    ctx.fillStyle = '#cdd8ea';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + GUARD.radius + 14);
  }
}

function drawCameras(ctx, cameras, solids) {
  for (const camera of cameras) {
    const color = cameraConeColor(camera) === 'cyan' ? CYAN : '#5a6b7a';
    fillCone(ctx, camera, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, solids, color, 0.26);
  }
  for (const camera of cameras) {
    ctx.fillStyle = '#22303f';
    ctx.fillRect(camera.x - 8, camera.y - 8, 16, 16);
    ctx.strokeStyle = cameraConeColor(camera) === 'cyan' ? CYAN : '#5a6b7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 8, camera.y - 8, 16, 16);
    ctx.fillStyle = cameraConeColor(camera) === 'cyan' ? CYAN : '#5a6b7a';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.angle) * 12, camera.y + Math.sin(camera.angle) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9fb4c8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(camera.label, camera.x, camera.y - 14);
  }
}

function drawThief(ctx, thief, time) {
  // Footstep ripples are drawn by the caller; here the hooded figure.
  const bob = thief.moving ? Math.sin(time * 10) * 1.5 : 0;
  ctx.fillStyle = '#101018';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8ecf4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y + bob, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point in the facing direction.
  ctx.fillStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.moveTo(thief.x + Math.cos(thief.angle) * 18, thief.y + Math.sin(thief.angle) * 18 + bob);
  ctx.lineTo(thief.x + Math.cos(thief.angle + 2.5) * 9, thief.y + Math.sin(thief.angle + 2.5) * 9 + bob);
  ctx.lineTo(thief.x + Math.cos(thief.angle - 2.5) * 9, thief.y + Math.sin(thief.angle - 2.5) * 9 + bob);
  ctx.closePath();
  ctx.fill();
  // Satchel: a brass dot on the back.
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.arc(thief.x - Math.cos(thief.angle) * 8, thief.y - Math.sin(thief.angle) * 8 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Sneak: a faint ring showing the quiet radius.
  if (thief.sneaking) {
    ctx.strokeStyle = 'rgba(232, 236, 244, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCoins(ctx, coins) {
  for (const coin of coins) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = colorWithAlpha(GOLD, 0.4);
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, GUARD.coinEarshot * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRipples(ctx, ripples) {
  for (const ripple of ripples) {
    const alpha = Math.max(0, 0.4 - ripple.age * 0.5);
    ctx.strokeStyle = `rgba(232, 236, 244, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, 6 + ripple.age * 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHoldRing(ctx, thief) {
  const hold = thief.holdTarget;
  if (!hold) return;
  const fraction = Math.min(1, hold.progress / hold.seconds);
  ctx.fillStyle = 'rgba(6, 10, 20, 0.75)';
  ctx.fillRect(ROOM.width / 2 - 170, ROOM.height - 96, 340, 44);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.width / 2 - 170, ROOM.height - 96, 340, 44);
  ctx.fillStyle = GOLD;
  ctx.fillRect(ROOM.width / 2 - 158, ROOM.height - 78, 316 * fraction, 10);
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hold.label + '…', ROOM.width / 2, ROOM.height - 62);
}

function drawHud(ctx, state) {
  const { level, thief, alarm, levelIndex } = state;
  ctx.fillStyle = 'rgba(6, 10, 20, 0.82)';
  ctx.fillRect(0, 0, ROOM.width, 52);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${levelIndex + 1}/3 · ${level.name}`, 20, 22);
  ctx.fillStyle = '#9fb4c8';
  ctx.font = '12px sans-serif';
  ctx.fillText(thief.lootTaken ? 'Loot secured — reach the extraction!' : level.briefing, 20, 40);
  // The alarm meter: chunky, centre-top, impossible to miss.
  const meterW = 340;
  const meterX = ROOM.width / 2 - meterW / 2;
  const band = alarmBand(alarm.value);
  const bandColor = band === 'red' ? RED : band === 'amber' ? AMBER : '#2e9e8a';
  ctx.fillStyle = '#0a0f1c';
  ctx.fillRect(meterX - 2, 10, meterW + 4, 26);
  ctx.strokeStyle = bandColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX - 2, 10, meterW + 4, 26);
  ctx.fillStyle = bandColor;
  ctx.fillRect(meterX, 12, meterW * (alarm.value / 100), 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(alarm.value)}%`, ROOM.width / 2, 28);
  // Right side: loot, coins, EMP.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`$${thief.lootValue.toLocaleString('en-US')}`, ROOM.width - 20, 22);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '12px sans-serif';
  const coinText = '●'.repeat(Math.max(0, thief.coins)) + '○'.repeat(Math.max(0, 3 - thief.coins));
  ctx.fillText(`COINS ${coinText}   EMP ${Math.round(thief.empCharge)}%`, ROOM.width - 20, 40);
  if (thief.hasKeycard) {
    ctx.fillStyle = GOLD;
    ctx.fillText('KEYCARD ✓', ROOM.width - 20, 58);
  }
  // EMP active banner.
  if (thief.empActiveLeft > 0) {
    ctx.fillStyle = CYAN;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`EMP ACTIVE — CAMERAS DARK ${Math.ceil(thief.empActiveLeft)}s`, ROOM.width / 2, 68);
  }
}

function drawVignette(ctx, alarm) {
  const strength = 0.25 + (alarm.value / 100) * 0.5;
  const gradient = ctx.createRadialGradient(
    ROOM.width / 2,
    ROOM.height / 2,
    ROOM.height * 0.35,
    ROOM.width / 2,
    ROOM.height / 2,
    ROOM.height * 0.85,
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  const edge = alarm.value >= 75 ? 'rgba(120, 0, 0, ' : 'rgba(0, 0, 0, ';
  gradient.addColorStop(1, `${edge}${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
}

function drawSpottedFlash(ctx, state) {
  if (state.alarm.spottedFreezeLeft <= 0) return;
  ctx.fillStyle = 'rgba(255, 30, 30, 0.25)';
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  ctx.fillStyle = RED;
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTTED!', ROOM.width / 2, ROOM.height / 2 - 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  const by = state.alarm.spottedBy === 'camera' ? 'a camera' : state.alarm.spottedBy === 'laser' ? 'the lasers' : 'a guard';
  ctx.fillText(`Seen by ${by} — the alarm is full.`, ROOM.width / 2, ROOM.height / 2 + 20);
}

/** Draw the live game frame: room, cones, actors, HUD, vignette. */
export function drawGame(ctx, state, time) {
  const { level, guards, cameras, thief, solids } = state;
  drawFloor(ctx, time);
  drawVents(ctx, level);
  drawExtraction(ctx, level, thief.lootTaken, time);
  drawLoot(ctx, level, time, thief.lootTaken);
  drawDoors(ctx, level);
  drawLasers(ctx, level, time);
  drawCover(ctx, level);
  drawWalls(ctx, level);
  drawCameras(ctx, cameras, solids);
  drawGuards(ctx, guards, solids, time);
  drawConsoles(ctx, level, cameras);
  drawCoins(ctx, state.coins);
  drawRipples(ctx, state.ripples);
  drawThief(ctx, thief, time);
  drawHud(ctx, state);
  drawHoldRing(ctx, thief);
  drawVignette(ctx, state.alarm);
  drawSpottedFlash(ctx, state);
  if (state.flashText) {
    ctx.fillStyle = 'rgba(6, 10, 20, 0.8)';
    ctx.fillRect(ROOM.width / 2 - 260, 84, 520, 34);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.flashText, ROOM.width / 2, 107);
  }
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4, 7, 14, 0.82)';
  ctx.fillRect(0, 0, ROOM.width, ROOM.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(ROOM.width / 2 - 330, 150, 660, 440);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, ROOM.width / 2, 240);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, ROOM.width / 2, 300 + i * 34);
  });
}

export function drawTitle(ctx, state) {
  drawFloor(ctx, 0);
  overlayPanel(
    ctx,
    'VAULTFALL',
    [
      'One Night at the Meridian',
      '',
      'WASD move · Shift sneak · Q / click toss a coin',
      'E EMP pulse · Hold F lift, crack, pick, hack',
      'M mute · R restart',
      '',
      `Best getaway: $${(state.best ?? 0).toLocaleString('en-US')}`,
      '',
      'Press ENTER to start the night',
    ],
    BRASS,
  );
}

export function drawBusted(ctx, state) {
  drawGame(ctx, state, state.time);
  overlayPanel(
    ctx,
    'BUSTED',
    [
      `The ${state.level.name} job is blown.`,
      `Loot carried: $${state.thief.lootValue.toLocaleString('en-US')}`,
      `Alarm peaked at ${Math.round(state.alarm.peak)}%`,
      '',
      'Press R to try the night again',
    ],
    RED,
  );
}

export function drawLevelClear(ctx, state) {
  drawGame(ctx, state, state.time);
  overlayPanel(
    ctx,
    state.levelIndex >= 2 ? 'CLEAN GETAWAY' : 'ROOM CLEAR',
    [
      `${state.level.name} — grade ${state.grade}`,
      `Loot this room: $${state.levelScore.toLocaleString('en-US')}`,
      `Total so far: $${state.totalScore.toLocaleString('en-US')}`,
      state.alarm.everSpotted ? 'Spotted at least once — no ghost bonus.' : 'GHOST BONUS — never fully spotted!',
      '',
      'Press ENTER for the next room',
    ],
    '#50ff8c',
  );
}

export function drawWin(ctx, state) {
  drawGame(ctx, state, state.time);
  overlayPanel(
    ctx,
    'CLEAN GETAWAY',
    [
      'Three rooms. One night. The Aurum Reserve is yours.',
      `Total loot: $${state.totalScore.toLocaleString('en-US')}`,
      `Best getaway: $${(state.best ?? 0).toLocaleString('en-US')}`,
      '',
      'Press R to run the night again',
    ],
    GOLD,
  );
}
