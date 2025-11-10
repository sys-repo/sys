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

  const vFrom = before.length ? before[before.length - 1].virtual.to : (0 as t.Msecs);
  const insertedResolved = resolve(pieces, durations);

  // Rebase inserted to vFrom
  let baseInserted = insertedResolved.segments;
  if (baseInserted.length > 0) {
    const base = baseInserted[0].virtual.from;
    baseInserted = baseInserted.map((s) => ({
      ...s,
      virtual: {
        from: (vFrom + (s.virtual.from - base)) as t.Msecs,
        to: (vFrom + (s.virtual.to - base)) as t.Msecs,
      },
    }));
  }

  // Rebase "after"
  const newStart = baseInserted.length ? baseInserted[baseInserted.length - 1].virtual.to : vFrom;
  const delta = (newStart - (after[0]?.virtual.from ?? newStart)) as t.Msecs;
  const rebasedAfter = after.map((s) => ({
    ...s,
    virtual: {
      from: (s.virtual.from + delta) as t.Msecs,
      to: (s.virtual.to + delta) as t.Msecs,
    },
  }));

  const segments = [...before, ...baseInserted, ...rebasedAfter];
  const total = segments.length ? segments[segments.length - 1].virtual.to : (0 as t.Msecs);
  return { segments, total };
}

/**
 * Concatenate two resolved timelines, rebasing vFrom/vTo.
 */
export function concat(
  a: t.TimecodeCompositionResolved,
  b: t.TimecodeCompositionResolved,
): t.TimecodeCompositionResolved {
  if (b.segments.length === 0) return a;
  if (a.segments.length === 0) return b;

  const base = a.total;
  const rebasedB = b.segments.map((s) => ({
    ...s,
    virtual: {
      from: (s.virtual.from + base) as t.Msecs,
      to: (s.virtual.to + base) as t.Msecs,
    },
  }));

  const segments = [...a.segments, ...rebasedB];
  const total = (a.total + b.total) as t.Msecs;
  return { segments, total };
}
