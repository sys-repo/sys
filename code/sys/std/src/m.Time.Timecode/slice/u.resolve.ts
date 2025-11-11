import { type t } from '../common.ts';

/**
 * Resolve a parsed slice into a concrete [from,to) window.
 */
export function resolve(slice: t.TimecodeSlice, total: t.Msecs): t.TimeWindowMs {
  const clamp = (n: number) => Math.max(0, Math.min(Number(total), n)) as t.Msecs;

  // start
  let from: t.Msecs;
  switch (slice.start.kind) {
    case 'open':
      from = 0 as t.Msecs;
      break;
    case 'abs':
      from = clamp(slice.start.ms);
      break;
    case 'relEnd':
      from = clamp(Number(total) - Number(slice.start.ms));
      break;
  }

  // end
  let to: t.Msecs;
  switch (slice.end.kind) {
    case 'open':
      to = total;
      break;
    case 'abs':
      to = clamp(slice.end.ms);
      break;
    case 'relEnd':
      // Absolute end position measured from total:
      to = clamp(Number(total) - Number(slice.end.ms));
      break;
  }

  // enforce half-open and monotonic ordering
  if (Number(to) < Number(from)) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  return { from, to };
}

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
