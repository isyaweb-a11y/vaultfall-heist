// All sound is procedural WebAudio — oscillators and filtered noise, no
// audio files. Everything starts after the first user gesture, and M mutes.
export function makeSound() {
  return {
    ctx: null,
    muted: false,
    padNodes: null,
    tickTimer: 0,
  };
}

function ensureContext(sound) {
  if (!sound.ctx) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    sound.ctx = new AudioContext();
  }
  if (sound.ctx.state === 'suspended') void sound.ctx.resume();
  return sound.ctx;
}

function tone(sound, freq, duration, type, gain, slideTo) {
  if (sound.muted) return;
  const ctx = ensureContext(sound);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playStep(sound, sneaking) {
  tone(sound, sneaking ? 140 : 190, 0.06, 'sine', sneaking ? 0.03 : 0.06, 90);
}

export function playCoin(sound) {
  tone(sound, 2400, 0.09, 'triangle', 0.12, 1800);
  setTimeout(() => tone(sound, 3100, 0.12, 'triangle', 0.1, 2400), 70);
}

export function playCoinLand(sound) {
  tone(sound, 1800, 0.05, 'triangle', 0.08, 1200);
}

export function playEmp(sound) {
  tone(sound, 900, 0.35, 'sawtooth', 0.1, 120);
  tone(sound, 1400, 0.25, 'square', 0.05, 200);
}

export function playPick(sound) {
  tone(sound, 520, 0.08, 'square', 0.05, 700);
}

export function playLoot(sound) {
  tone(sound, 660, 0.15, 'triangle', 0.12);
  setTimeout(() => tone(sound, 880, 0.15, 'triangle', 0.12), 110);
  setTimeout(() => tone(sound, 1320, 0.3, 'triangle', 0.12), 220);
}

export function playSpotted(sound) {
  tone(sound, 220, 0.5, 'sawtooth', 0.14, 440);
  tone(sound, 110, 0.6, 'square', 0.08, 55);
}

export function playBusted(sound) {
  tone(sound, 330, 0.9, 'sawtooth', 0.14, 55);
}

export function playWin(sound) {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => tone(sound, freq, 0.35, 'triangle', 0.12), i * 130);
  });
}

export function playTick(sound) {
  tone(sound, 1200, 0.04, 'square', 0.05);
}

export function playLaser(sound) {
  tone(sound, 180, 0.3, 'sawtooth', 0.08, 90);
}

/** The low synth pad that hums under the whole night. */
export function startPad(sound) {
  if (sound.muted || sound.padNodes) return;
  const ctx = ensureContext(sound);
  if (!ctx) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  gain.connect(ctx.destination);
  const oscA = ctx.createOscillator();
  oscA.type = 'sine';
  oscA.frequency.value = 55;
  const oscB = ctx.createOscillator();
  oscB.type = 'sine';
  oscB.frequency.value = 55 * 1.5;
  const oscC = ctx.createOscillator();
  oscC.type = 'triangle';
  oscC.frequency.value = 110.3;
  const gainC = ctx.createGain();
  gainC.gain.value = 0.3;
  oscA.connect(gain);
  oscB.connect(gain);
  oscC.connect(gainC);
  gainC.connect(gain);
  oscA.start();
  oscB.start();
  oscC.start();
  sound.padNodes = { oscA, oscB, oscC, gain };
}

export function stopPad(sound) {
  if (!sound.padNodes) return;
  const { oscA, oscB, oscC, gain } = sound.padNodes;
  try {
    gain.gain.setTargetAtTime(0, sound.ctx.currentTime, 0.1);
    oscA.stop(sound.ctx.currentTime + 0.5);
    oscB.stop(sound.ctx.currentTime + 0.5);
    oscC.stop(sound.ctx.currentTime + 0.5);
  } catch {
    // Already stopped; nothing to do.
  }
  sound.padNodes = null;
}

export function toggleMute(sound) {
  sound.muted = !sound.muted;
  if (sound.muted) stopPad(sound);
  else startPad(sound);
  return sound.muted;
}
