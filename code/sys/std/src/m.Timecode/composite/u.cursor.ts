import { type t } from './common.ts';
import { Map } from './m.Map.ts';

/**
 * Cursor factory over a resolved composition.
 * Provides: at(v), next(index), prev(index)
 */
export function cursor(resolved: t.TimecodeCompositionResolved) {
  const { segments } = resolved;

  /** Lookup segment at virtual time (or null if out of range). */
  const at = (v: t.TimecodeVTime): t.TimecodeMapToSourceResult | null => {
    return Map.toSource(segments, v);
  };

  /** Next segment index or null. */
  const next = (index: number): number | null => {
    if (index < 0) return segments.length > 0 ? 0 : null;
    const n = index + 1;
    return n < segments.length ? n : null;
  };

  /** Previous segment index or null. */
  const prev = (index: number): number | null => {
    const p = index - 1;
    return p >= 0 ? p : null;
  };

  return { at, next, prev } as const;
}
