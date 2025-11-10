import { type t, Slice } from './common.ts';

/**
 * Validate spec+durations for composability; never throws.
 */
export function validate(
  spec: t.TimecodeCompositionSpec,
  durations: t.TimecodeDurationMap,
): { ok: boolean; issues: readonly t.TimecodeCompositeIssue[] } {
  const issues: t.TimecodeCompositeIssue[] = [];

  for (const piece of spec) {
    const d = durations[piece.src];
    if (typeof d !== 'number' || d <= 0) {
      issues.push({ kind: 'missing-duration', src: piece.src });
      continue;
    }

    const parsed = tryParseSlice(piece.slice);
    if (!parsed.ok) {
      issues.push({ kind: 'invalid-slice', src: piece.src, slice: String(piece.slice ?? '') });
      continue;
    }

    if (parsed.parsed) {
      const r = Slice.resolve(parsed.parsed, d);
      if (r.to <= r.from) {
        issues.push({ kind: 'zero-length-segment', src: piece.src });
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

/**
 * Helpers:
 */
function tryParseSlice(
  input?: string | t.TimecodeSliceString,
): { ok: true; parsed?: t.TimecodeSlice } | { ok: false } {
  if (!input) return { ok: true };
  const s = String(input);
  if (!Slice.is(s)) return { ok: false };
  return { ok: true, parsed: Slice.parse(s as t.TimecodeSliceString) };
}
