import { type t, Slice } from './common.ts';
import { normalize } from './u.normalize.ts';

/**
 * Validate spec+durations for composability; never throws.
 */
export function validate(
  spec: t.TimecodeCompositionSpec,
  durations: t.TimecodeDurationMap,
): { readonly ok: boolean; readonly issues: readonly t.TimecodeCompositeIssue[] } {
  const out: t.TimecodeCompositeIssue[] = [];
  const norm = normalize(spec);

  for (const p of norm) {
    // 1) Slice grammar.
    if (p.slice && !Slice.is(p.slice)) {
      out.push({ kind: 'invalid-slice', src: p.src, slice: String(p.slice) });
      continue;
    }

    // 2) Duration availability: prefer inline, else map.
    const total =
      Number.isFinite(p.duration) && Number(p.duration) >= 0
        ? (p.duration as t.Msecs)
        : (durations[p.src] as t.Msecs | undefined);

    // Determine if this piece *needs* total to resolve.
    const needsTotal =
      !p.slice /* open whole asset */ ||
      (p.slice
        ? (() => {
            const parsed = Slice.parse(Slice.toString(p.slice as string));
            return parsed.start.kind !== 'abs' || parsed.end.kind !== 'abs';
          })()
        : false);

    if (needsTotal && !(typeof total === 'number' && isFinite(total) && total >= 0)) {
      out.push({ kind: 'missing-duration', src: p.src });
      continue;
    }

    // 3) Zero-length after resolution (when total known or not needed).
    if (p.slice) {
      const parsed = Slice.parse(Slice.toString(p.slice as string));
      if (parsed.start.kind === 'abs' && parsed.end.kind === 'abs') {
        const from = (parsed.start as any).ms as t.Msecs;
        const to = (parsed.end as any).ms as t.Msecs;
        if (to <= from) out.push({ kind: 'zero-length-segment', src: p.src });
      } else if (typeof total === 'number') {
        const win = Slice.resolve(parsed, total);
        if (win.to <= win.from) out.push({ kind: 'zero-length-segment', src: p.src });
      }
    }
  }

  return { ok: out.length === 0, issues: out };
}

/**
 * Helpers:
 */
function tryParseSlice(
  input?: string | t.TimecodeSliceString,
): { ok: true; parsed?: t.TimecodeSliceNormalized } | { ok: false } {
  if (!input) return { ok: true };
  const s = String(input);
  if (!Slice.is(s)) return { ok: false };
  return { ok: true, parsed: Slice.parse(s as t.TimecodeSliceString) };
}
