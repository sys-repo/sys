import { Num } from './common.ts';

/**
 * Helpers:
 */
export const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
export const asArray = (v: number | number[] | undefined, length: number, d = 0) => {
  return Array.isArray(v) ? [...v] : Array.from({ length }, () => v ?? d);
};

export const normalize = (ns: number[], fallbackLen: number): number[] => {
  if (!ns || ns.length !== fallbackLen) {
    // Even split:
    const even = 1 / Math.max(1, fallbackLen);
    return Array.from({ length: fallbackLen }, () => even);
  }
  const sum = ns.reduce((a, b) => a + (isFinite(b) ? Math.max(0, b) : 0), 0);
  if (sum <= 0) {
    const even = 1 / Math.max(1, ns.length);
    return ns.map(() => even);
  }
  return ns.map((n) => Math.max(0, n) / sum);
};

export const clampPairWithBounds = (
  a: number,
  b: number,
  delta: number,
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
): [number, number] => {
  // Try apply delta to a (increase) / b (decrease):
  let nextA = a + delta;
  let nextB = b - delta;

  // Respect bounds; if out of bounds, push back the overflow to the other side.
  if (nextA < minA) {
    const overshoot = minA - nextA;
    nextA = minA;
    nextB = nextB - overshoot; // give more to B to keep sum
  }
  if (nextA > maxA) {
    const overshoot = nextA - maxA;
    nextA = maxA;
    nextB = nextB + overshoot;
  }
  if (nextB < minB) {
    const overshoot = minB - nextB;
    nextB = minB;
    nextA = nextA - overshoot;
  }
  if (nextB > maxB) {
    const overshoot = nextB - maxB;
    nextB = maxB;
    nextA = nextA + overshoot;
  }

  // Final safety clamp:
  nextA = Num.clamp(minA, maxA, nextA);
  nextB = Num.clamp(minB, maxB, nextB);
  return [nextA, nextB];
};

export const renormalizePreservingPair = (
  ratios: number[],
  pairIndex: number, // gutter i → pair (i, i+1)
): number[] => {
  /** Renormalize preserving the active pair’s sum exactly. */
  const total = sum(ratios);
  if (!isFinite(total) || Math.abs(total - 1) < 1e-6) return ratios;

  const i = pairIndex;
  const keep = ratios[i] + ratios[i + 1];
  const othersIdx = ratios.map((_, k) => k).filter((k) => k !== i && k !== i + 1);
  const othersSum = sum(othersIdx.map((k) => ratios[k]));
  if (othersSum <= 0) return ratios;

  const targetOthers = 1 - keep;
  const scale = targetOthers / othersSum;
  const next = ratios.slice();

  for (const k of othersIdx) next[k] = next[k] * scale;
  return next;
};

export const gridTracks = (
  ratios: number[],
  gutterPx: number,
  orientation: 'horizontal' | 'vertical',
) => {
  // Build CSS grid tracks: fr, px, fr, px, ...
  const tracks: string[] = [];
  ratios.forEach((r, i) => {
    tracks.push(`${r}fr`);
    if (i < ratios.length - 1) tracks.push(`${gutterPx}px`);
  });
  return orientation === 'horizontal'
    ? { cols: tracks.join(' '), rows: '1fr' }
    : { cols: '1fr', rows: tracks.join(' ') };
};
