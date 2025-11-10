import { type t } from './common.ts';

/**
 * Build a resolved timeline from authoring spec + known durations.
 * - Accepts slice forms:
 *    • "..END"          → start = 0, end = END
 *    • "START..END"     → start = START, end = END
 *    • "START.."        → start = START, end = durations[src] (required)
 *    • undefined        → start = 0, end = durations[src] (required)
 * - Computes virtual [vFrom..vTo) by accumulating each segment length.
 */
export function resolve(
  spec: t.TimecodeCompositionSpec,
  durations: t.TimecodeDurationMap = {},
): t.TimecodeCompositionResolved {
  const segments: t.TimecodeResolvedSegment[] = [];
  let v = 0 as t.Msecs;

  for (const piece of spec) {
    const src = piece.src;
    const sliceStr = piece.slice ? String(piece.slice).trim() : undefined;

    let from = 0 as t.Msecs;
    let to: t.Msecs | undefined;

    if (sliceStr) {
      const i = sliceStr.indexOf('..');
      if (i < 0) {
        continue; // invalid grammar → skip this piece
      }
      const start = sliceStr.slice(0, i).trim();
      const end = sliceStr.slice(i + 2).trim();

      const hasStart = start.length > 0;
      const hasEnd = end.length > 0;

      const startMs = hasStart ? toMs(start) : (0 as number | null);
      const endMs = hasEnd ? toMs(end) : (durations[src] ?? null);

      if (startMs == null || endMs == null) continue;

      from = startMs as t.Msecs;
      to = endMs as t.Msecs;
    }

    if (to == null) {
      const d = durations[src];
      if (typeof d !== 'number' || d <= 0) {
        // no explicit end and no duration: cannot resolve this piece
        continue;
      }
      to = d as t.Msecs;
    }

    const len = (to - from) as t.Msecs;
    if (len <= 0) continue;

    const seg: t.TimecodeResolvedSegment = {
      src,
      from,
      to,
      vFrom: v,
      vTo: (v + len) as t.Msecs,
    } as t.TimecodeResolvedSegment;

    segments.push(seg);
    v = seg.vTo;
  }

  return { total: v, segments };
}

/** Parse "HH:MM:SS(.mmm)" into ms. Returns null if invalid. */
function toMs(hms: string): number | null {
  const parts = hms.split(':'); // HH:MM:SS(.mmm)
  if (parts.length < 3) return null;
  const [hh, mm, ssRaw] = parts;
  const [ss, ms = '0'] = ssRaw.split('.');
  const h = Number(hh),
    m = Number(mm),
    s = Number(ss);
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;
  const msNum = Number(ms.padEnd(3, '0').slice(0, 3));
  if (Number.isNaN(msNum)) return null;
  return (h * 3600 + m * 60 + s) * 1000 + msNum;
}
