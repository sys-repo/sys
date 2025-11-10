import { type t } from './common.ts';
import { resolve } from './u.resolve.ts';

export const Ops: t.TimecodeCompositeLib['Ops'] = {
  splice,
  concat,
};

/**
 * Insert pieces at segment boundary; returns a new resolved timeline.
 */
export function splice(
  resolved: t.TimecodeCompositionResolved,
  at: number,
  pieces: t.TimecodeCompositionSpec,
  durations: t.TimecodeDurationMap,
): t.TimecodeCompositionResolved {
  const before = resolved.segments.slice(0, at);
  const after = resolved.segments.slice(at);

  const vFrom = before.length ? before[before.length - 1].vTo : (0 as t.Msecs);
  const insertedResolved = resolve(pieces, durations);

  // Rebase inserted to vFrom
  let baseInserted = insertedResolved.segments;
  if (baseInserted.length > 0) {
    const base = baseInserted[0].vFrom;
    baseInserted = baseInserted.map((s) => ({
      ...s,
      vFrom: (vFrom + (s.vFrom - base)) as t.Msecs,
      vTo: (vFrom + (s.vTo - base)) as t.Msecs,
    }));
  }

  // Rebase "after"
  const newStart = baseInserted.length ? baseInserted[baseInserted.length - 1].vTo : vFrom;
  const delta = (newStart - (after[0]?.vFrom ?? newStart)) as t.Msecs;
  const rebasedAfter = after.map((s) => ({
    ...s,
    vFrom: (s.vFrom + delta) as t.Msecs,
    vTo: (s.vTo + delta) as t.Msecs,
  }));

  const segments = [...before, ...baseInserted, ...rebasedAfter];
  const total = segments.length ? segments[segments.length - 1].vTo : (0 as t.Msecs);
  return { segments, total };
}

/** Concatenate two resolved timelines, rebasing vFrom/vTo. */
export function concat(
  a: t.TimecodeCompositionResolved,
  b: t.TimecodeCompositionResolved,
): t.TimecodeCompositionResolved {
  if (b.segments.length === 0) return a;
  if (a.segments.length === 0) return b;

  const base = a.total;
  const rebasedB = b.segments.map((s) => ({
    ...s,
    vFrom: (s.vFrom + base) as t.Msecs,
    vTo: (s.vTo + base) as t.Msecs,
  }));

  const segments = [...a.segments, ...rebasedB];
  const total = (a.total + b.total) as t.Msecs;
  return { segments, total };
}
