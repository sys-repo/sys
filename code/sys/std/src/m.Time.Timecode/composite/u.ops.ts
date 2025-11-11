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
  const idx = Math.max(0, Math.min(at, resolved.segments.length));

  const before = resolved.segments.slice(0, idx);
  const after = resolved.segments.slice(idx);

  // Resolve inserted with canonical path (prefers inline duration)
  const insertedResolved = resolve(pieces, durations);
  const inserted = insertedResolved.segments;

  // Base offset for inserted block
  const vBase = (before.at(-1)?.virtual.to ?? 0) as t.Msecs;

  // Re-base INSERTED → start at vBase
  const rebasedInserted =
    inserted.length === 0
      ? inserted
      : (() => {
          const v0 = inserted[0].virtual.from;
          return inserted.map((s) => ({
            ...s,
            virtual: {
              from: (vBase + (s.virtual.from - v0)) as t.Msecs,
              to: (vBase + (s.virtual.to - v0)) as t.Msecs,
            },
          }));
        })();

  // Re-base AFTER to follow the inserted block (or vBase if none inserted)
  const newAfterStart = (rebasedInserted.at(-1)?.virtual.to ?? vBase) as t.Msecs;
  const oldAfterStart = (after[0]?.virtual.from ?? newAfterStart) as t.Msecs;
  const delta = (newAfterStart - oldAfterStart) as t.Msecs;

  const rebasedAfter =
    delta === 0
      ? after
      : after.map((s) => ({
          ...s,
          virtual: {
            from: (s.virtual.from + delta) as t.Msecs,
            to: (s.virtual.to + delta) as t.Msecs,
          },
        }));

  const segments = [...before, ...rebasedInserted, ...rebasedAfter];
  const total = (segments.at(-1)?.virtual.to ?? 0) as t.Msecs;
  return { segments, total };
}

/**
 * Concatenate two resolved timelines, rebasing vFrom/vTo.
 */
function concat(
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
