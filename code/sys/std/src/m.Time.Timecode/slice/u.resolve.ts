import { type t } from '../common.ts';

export const resolve: t.TimecodeSliceLib['resolve'] = (slice, total) => {
  const clamp = (n: number) => Math.max(0, Math.min(total, n));

  const startMs = resolveBound(slice.start, total, 'start');
  const endMs = resolveBound(slice.end, total, 'end');

  const from = clamp(startMs);
  const to = clamp(endMs);

  // Coerce to a valid window ensuring from <= to:
  if (from <= to) return { from, to };
  return { from: to, to: from };
};

/**
 * Resolve a classified bound against total duration.
 */
function resolveBound(bound: t.TimecodeSliceBound, total: t.Msecs, side: 'start' | 'end'): t.Msecs {
  switch (bound.kind) {
    case 'abs':
      return bound.ms;
    case 'relEnd':
      return total - bound.ms;
    case 'open':
      return side === 'start' ? 0 : total;
  }
}
