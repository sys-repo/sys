import { type t } from '../common.ts';

/**
 * Build a minimal, deterministic TimecodeResolved used by our stub.
 */
export function makeResolved(total: number, segCount: number): t.TimecodeResolved {
  const segments: t.TimecodeResolvedSegment[] = Array.from({ length: segCount }, (_, i) => {
    const from = (i * 100) as t.Msecs;
    const to = (from + 100) as t.Msecs;
    return {
      src: `test:${i}` as t.StringRef,
      virtual: { from, to },
      original: { from, to },
    };
  });

  return {
    total: total as t.Msecs,
    segments,
    is: { empty: segCount === 0, valid: true },
    issues: [],
    stats: {
      pieces: segCount,
      segments: segCount,
      dropped: 0,
      absSlices: 0,
      open: { start: 0, end: 0, relEnd: 0 },
    },
  } as t.TimecodeResolved;
}

/**
 * Build a deterministic resolved segment for test timelines.
 */
export function seg(
  vf: t.Msecs,
  vt: t.Msecs,
  of: t.Msecs,
  src: t.StringRef = 'test:0' as t.StringRef,
): t.TimecodeResolvedSegment {
  return {
    src,
    virtual: { from: vf as t.Msecs, to: vt as t.Msecs },
    original: { from: of as t.Msecs, to: (of + (vt - vf)) as t.Msecs },
  };
}

/**
 * Compose a minimal resolved timeline from segments.
 */
export function resolved(
  total: t.Msecs,
  segments: readonly t.TimecodeResolvedSegment[],
): t.TimecodeCompositionResolved {
  return { total, segments };
}
