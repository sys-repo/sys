import { type t } from '../common.ts';

export const Durations: t.CompositeVideoHelpers['Durations'] = {
  diff,
  probe,
};

/**
 * List srcs whose duration changed.
 */
export function diff(prev: t.VideoDurationMap, next: t.VideoDurationMap): readonly string[] {
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
export async function probe(srcs: readonly string[]): Promise<t.VideoDurationMap> {
  const map: Record<string, t.Msecs> = {};
  for (const src of srcs) map[src] = 0 as t.Msecs;
  return map;
}
