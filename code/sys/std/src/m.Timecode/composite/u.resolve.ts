import { type t, Slice } from './common.ts';
import { normalize } from './u.normalize.ts';

/**
 * Build a resolved timeline from authoring spec + known durations.
 * - Accepts slice forms:
 *     - "..END"          → start = 0, end = END
 *     - "START..END"     → start = START, end = END
 *     - "START.."        → start = START, end = durations[src] (required)
 *     - undefined        → start = 0, end = durations[src] (required)
 * - Computes virtual span by accumulating each segment length.
 *   (virtual is half-open [from,to) on the composite timeline)
 */
export function resolve(
  spec: t.TimecodeCompositionSpec,
  durations: t.TimecodeDurationMap,
): t.TimecodeCompositionResolved {
  const norm = normalize(spec);
  const segments: t.TimecodeResolvedSegment[] = [];
  let vFrom = 0 as t.Msecs;

  for (const p of norm) {
    // 1) Pick total: inline duration wins; else duration map.
    const total =
      typeof p.duration === 'number' && isFinite(p.duration) && p.duration >= 0
        ? (p.duration as t.Msecs)
        : (durations[p.src] as t.Msecs | undefined);

    if (typeof total !== 'number' || !isFinite(total) || total <= 0) continue;

    // 2) Resolve source window.
    let win: t.TimeWindowMs;
    if (p.slice) {
      const s = String(p.slice);
      if (!Slice.is(s)) continue; // guard: invalid slice (validate() would flag)
      const parsed = Slice.parse(s as t.TimecodeSliceString);
      win = Slice.resolve(parsed, total);
    } else {
      win = { from: 0 as t.Msecs, to: total };
    }
    if (win.to <= win.from) continue;

    // 3) Project into virtual timeline (half-open).
    const len = (Number(win.to) - Number(win.from)) as t.Msecs;
    const vTo = (Number(vFrom) + Number(len)) as t.Msecs;

    segments.push({
      src: p.src,
      original: { from: win.from, to: win.to },
      virtual: { from: vFrom, to: vTo },
    });

    vFrom = vTo;
  }

  const totalV = segments.length ? segments[segments.length - 1].virtual.to : (0 as t.Msecs);
  return { segments, total: totalV };
}
