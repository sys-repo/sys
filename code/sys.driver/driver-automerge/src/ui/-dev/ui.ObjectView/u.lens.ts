import { type t, Is, Try } from '../common.ts';

/**
 * Signals/ObjectView lenses: resolve from partials and generators → solid lenses.
 * - Accepts: Partial lenses or zero-arg generators that return a partial lens.
 * - Returns: Solid lenses only (both `path` and `field` present), with `field` trimmed.
 */
export function toLenses(lenses?: t.CrdtPartialLenses): t.CrdtLens[] {
  const items = lenses ?? [];
  return items.map(resolveLens).filter(isSolidLens).map(normalizeLens);
}

/**
 * Narrow a partial lens to a solid lens (both fields present).
 * Accepts undefined for filter-pipeline ergonomics.
 */
export function isSolidLens(v: t.CrdtPartialLens | undefined): v is t.CrdtLens {
  const hasPath = Array.isArray(v?.path);
  const hasField = typeof v?.name === 'string' && v.name.length > 0;
  return hasPath && hasField;
}

/**
 * Lens normalization (trim `field`).
 */
function normalizeLens(v: t.CrdtLens): t.CrdtLens {
  return { path: v.path, name: v.name.trim() };
}

/**
 * Resolve item or generator → partial lens (errors swallowed).
 */
function resolveLens(item: t.CrdtPartialLensInput): t.CrdtPartialLens | undefined {
  if (Is.func(item)) {
    const res = Try.catch(item as () => t.CrdtPartialLens);
    return res.ok ? res.data : undefined;
  }
  return item;
}
