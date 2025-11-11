import { type t } from './common.ts';
import { normalize } from './u.normalize.ts';

export const Durations: t.TimecodeCompositeLib['Durations'] = {
  diff,
  probe,
  with: merge,
};

/**
 * List srcs whose duration changed.
 */
function diff(prev: t.TimecodeDurationMap, next: t.TimecodeDurationMap): readonly string[] {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const k of keys) {
    if (prev[k] !== next[k]) changed.push(k);
  }
  return changed;
}

/**
 * Note:
 * - `probe` is a placeholder that returns 0 for every src.
 *   Host apps should provide a real implementation that reads media metadata
 *   (e.g., via HTMLVideoElement, MediaMetadata, or a server-side probe).
 */
async function probe(srcs: readonly string[]): Promise<t.TimecodeDurationMap> {
  const map: Record<string, t.Msecs> = {};
  for (const src of srcs) map[src] = 0 as t.Msecs;
  return map;
}

/**
 * Merge probed durations into a spec (non-mutating).
 * - Inline finite, non-negative `piece.duration` takes precedence.
 * - Fills only when a mapped value is finite and ≥ 0.
 * - Always returns a freshly normalized array.
 */
function merge(
  spec: t.TimecodeCompositionSpec,
  map: t.TimecodeDurationMap,
): t.TimecodeCompositionSpec {
  const norm = normalize(spec);

  const finiteNonNeg = (n: unknown): n is t.Msecs =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0;

  return norm.map((p) => {
    const inline = p.duration;
    const fromMap = map[p.src];
    const eff = finiteNonNeg(inline)
      ? inline
      : finiteNonNeg(fromMap)
        ? (fromMap as t.Msecs)
        : undefined;
    return eff === undefined ? p : { ...p, duration: eff };
  });
}
