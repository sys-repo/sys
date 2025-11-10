import { type t } from './common.ts';

export const Durations: t.TimecodeCompositeLib['Durations'] = {
  diff,
  probe,
};

/**
 * List srcs whose duration changed.
 */
export function diff(prev: t.TimecodeDurationMap, next: t.TimecodeDurationMap): readonly string[] {
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
export async function probe(srcs: readonly string[]): Promise<t.TimecodeDurationMap> {
  const map: Record<string, t.Msecs> = {};
  for (const src of srcs) map[src] = 0 as t.Msecs;
  return map;
}
