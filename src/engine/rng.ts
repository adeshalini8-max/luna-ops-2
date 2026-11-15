export type SeededRng = (drawIndex: number) => number;

/**
 * Returns a stateless, indexable Mulberry32 stream. Random access keeps engine
 * transitions pure: the same seed and draw index always return the same value.
 */
export function mulberry32(seed: number): SeededRng {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError('Mulberry32 seed must be a safe integer.');
  }

  const normalizedSeed = seed >>> 0;

  return (drawIndex) => {
    if (!Number.isSafeInteger(drawIndex) || drawIndex < 0) {
      throw new RangeError('Mulberry32 draw index must be a non-negative safe integer.');
    }

    let value = (normalizedSeed + Math.imul(drawIndex + 1, 0x6d2b79f5)) >>> 0;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
