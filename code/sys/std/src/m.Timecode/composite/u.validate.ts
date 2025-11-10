import { Slice } from '../slice/mod.ts';
import { type t } from './common.ts';
import { tryParseSlice } from './u.ts';

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

  return { ok: issues.length === 0, issues };
}
