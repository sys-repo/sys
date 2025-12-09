import { type t } from './common.ts';

/**
 * Pure functional implementation of `Composite.toVirtualTimeline`.
 */
export const toVirtualTimeline: t.TimecodeCompositeLib['toVirtualTimeline'] = (spec) => {
  const issues: t.TimecodeIssue[] = [];

  const pieces = spec?.length ?? 0;
  let dropped = 0;
  let absSlices = 0;
  let openStart = 0;
  let openEnd = 0;
  let openRelEnd = 0;

  const segments: t.TimecodeResolvedSegment[] = [];
  let vFrom: t.Msecs = 0;

  if (!spec || spec.length === 0) {
    const stats: t.TimecodeResolutionStats = {
      pieces,
      segments: 0,
      dropped: 0,
      absSlices: 0,
      open: { start: 0, end: 0, relEnd: 0 },
    };
    return {
      segments,
      total: 0,
      is: { empty: true, valid: true },
      issues,
      stats,
    };
  }

  for (const piece of spec) {
    const src = String(piece?.src ?? '').trim() as t.StringRef;
    if (!src) {
      dropped += 1;
      issues.push({ kind: 'dropped-segment', severity: 'info', src, reason: 'missing-src' });
      continue;
    }

    const raw = piece.slice ? String(piece.slice).trim() : '';

    // Resolve original window [from,to)
    let from: t.Msecs = 0;
    let to: t.Msecs | undefined;

    if (raw) {
      const parsed = parseSlice(raw);
      if (!parsed) {
        dropped += 1;
        issues.push({ kind: 'invalid-slice', severity: 'error', src, slice: raw });
        issues.push({ kind: 'dropped-segment', severity: 'warn', src, reason: 'invalid-slice' });
        continue;
      }

      if (parsed.start.kind === 'open') openStart += 1;
      if (parsed.end.kind === 'open') openEnd += 1;
      if (parsed.end.kind === 'relEnd') openRelEnd += 1;

      if (parsed.start.kind === 'abs' && parsed.end.kind === 'abs') {
        absSlices += 1;
        from = parsed.start.ms;
        to = parsed.end.ms;
      } else if (piece.duration != null) {
        const total = piece.duration;
        const startMs: t.Msecs = parsed.start.kind === 'abs' ? parsed.start.ms : 0;
        const endMs =
          parsed.end.kind === 'abs'
            ? parsed.end.ms
            : parsed.end.kind === 'open'
              ? total
              : Number(total) - Number(parsed.end.ms); // relEnd

        from = startMs;
        to = endMs;
      } else {
        dropped += 1;
        issues.push({
          kind: 'unresolved-length',
          severity: 'error',
          src,
          slice: raw || undefined,
        });
        issues.push({
          kind: 'dropped-segment',
          severity: 'info',
          src,
          reason: 'unresolved-length',
        });
        continue;
      }
    } else if (piece.duration != null) {
      // No slice → whole asset when duration known
      from = 0;
      to = piece.duration;
    } else {
      dropped += 1;
      issues.push({ kind: 'unresolved-length', severity: 'error', src });
      issues.push({ kind: 'dropped-segment', severity: 'info', src, reason: 'unresolved-length' });
      continue;
    }

    if (to! <= from) {
      dropped += 1;
      issues.push({ kind: 'zero-length-segment', severity: 'warn', src });
      issues.push({ kind: 'dropped-segment', severity: 'info', src, reason: 'zero-length' });
      continue;
    }

    const len: t.Msecs = Number(to) - Number(from);
    const vTo: t.Msecs = Number(vFrom) + Number(len);

    segments.push({
      src,
      original: { from, to: to! },
      virtual: { from: vFrom, to: vTo },
    });

    vFrom = vTo;
  }

  const total: t.Msecs = segments.length ? segments[segments.length - 1].virtual.to : 0;
  const stats: t.TimecodeResolutionStats = {
    pieces,
    segments: segments.length,
    dropped,
    absSlices,
    open: { start: openStart, end: openEnd, relEnd: openRelEnd },
  };

  const hasError = issues.some((i) => i.severity === 'error');

  return {
    total,
    is: { empty: segments.length === 0, valid: !hasError },
    stats,
    segments,
    issues,
  };
};

/**
 * Minimal slice parser for "<start>..<end>" where:
 * - start: "" (open) | VTT time
 * - end:   "" (open) | VTT time | "-" + VTT time (relEnd)
 * Returns null for invalid lexical forms.
 */
function parseSlice(raw: string): {
  start: { kind: 'abs'; ms: number } | { kind: 'open' };
  end: { kind: 'abs'; ms: number } | { kind: 'open' } | { kind: 'relEnd'; ms: number };
} | null {
  const idx = raw.indexOf('..');
  if (idx < 0) return null;
  const left = raw.slice(0, idx);
  const right = raw.slice(idx + 2);

  // start
  let start: { kind: 'abs'; ms: number } | { kind: 'open' } | null = null;
  if (left === '') start = { kind: 'open' };
  else {
    if (left.startsWith('-')) return null; // negative start not supported
    const ms = parseTimecode(left);
    if (ms == null) return null;
    start = { kind: 'abs', ms };
  }

  // end
  let end: { kind: 'abs'; ms: number } | { kind: 'open' } | { kind: 'relEnd'; ms: number } | null =
    null;
  if (right === '') end = { kind: 'open' };
  else if (right.startsWith('-')) {
    const ms = parseTimecode(right.slice(1));
    if (ms == null) return null;
    end = { kind: 'relEnd', ms };
  } else {
    const ms = parseTimecode(right);
    if (ms == null) return null;
    end = { kind: 'abs', ms };
  }

  return { start: start!, end: end! };
}

/**
 * Parse "HH:MM:SS(.mmm)" or "MM:SS(.mmm)" to milliseconds.
 * Returns undefined for invalid forms.
 */
function parseTimecode(s: string): number | undefined {
  const m = /^(\d{1,2}:)?([0-5]?\d):([0-5]?\d)(\.\d{1,3})?$/.exec(s.trim());
  if (!m) return undefined;
  const hasHours = !!m[1];
  const h = hasHours ? Number(m[1].slice(0, -1)) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const frac = m[4] ? Number(m[4].slice(1).padEnd(3, '0')) : 0;
  if (min > 59 || sec > 59) return undefined;
  return h * 3600000 + min * 60000 + sec * 1000 + frac;
}
