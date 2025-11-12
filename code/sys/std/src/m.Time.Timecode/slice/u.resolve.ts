import { type t } from '../common.ts';

/**
 * Resolve a parsed slice into a concrete [from,to) window.
 */
export function resolve(slice: t.TimecodeSlice, total: t.Msecs): t.TimeWindowMs {
  const clamp = (n: number): t.Msecs => Math.max(0, Math.min(Number(total), n));

  // start
  let from: t.Msecs;
  switch (slice.start.kind) {
    case 'open':
      from = 0;
      break;
    case 'abs':
      from = clamp(slice.start.ms);
      break;
    case 'relEnd': {
      const ms = Number(slice.start.ms);
      from = ms === 0 ? 0 : clamp(Number(total) - ms);
      break;
    }
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
    case 'relEnd': {
      const ms = Number(slice.end.ms);
      to = ms === 0 ? total : clamp(Number(total) - ms);
      break;
    }
  }

  if (Number(to) < Number(from)) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  return { from, to };
}
