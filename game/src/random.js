// A tiny seeded RNG (mulberry32) so a fixed ?seed= always stages the same
// room: dust motes, guard look-around jitter and coin bounces never drift
// between two runs of the same screenshot.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a seeded rng. */
export function rangeInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** A float in [min, max) from a seeded rng. */
export function rangeFloat(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one element of an array from a seeded rng. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
