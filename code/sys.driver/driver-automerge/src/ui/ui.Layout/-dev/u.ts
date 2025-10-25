import { type t, Is, Try } from '../common.ts';

type PartialLens = Partial<t.SignalsObjectViewLens>;
type PartialLensItem = PartialLens | (() => PartialLens);
type PartialLensesInput = readonly PartialLensItem[];

/**
 * Signals/ObjectView lenses: resolve from partials and generators → solid lenses.
 * - Accepts: Partial lenses or zero-arg generators that return a partial lens.
 * - Returns: Solid lenses only (both `path` and `field` present), with `field` trimmed.
 */
export function toLenses(lenses: t.SignalsObjectViewProps['lenses']): t.SignalsObjectViewLens[] {
  const items = (lenses ?? []) as unknown as PartialLensesInput;
  return items.map(resolveLens).filter(isSolidLens).map(normalizeLens);
}

/** Narrow a partial lens to a solid lens (both fields present). Accepts undefined for filter-pipeline ergonomics. */
export function isSolidLens(v: PartialLens | undefined): v is t.SignalsObjectViewLens {
  const hasPath = Array.isArray(v?.path);
  const hasField = typeof v?.field === 'string' && v.field.length > 0;
  return hasPath && hasField;
}

/** Optional normalization (trim `field`). */
function normalizeLens(v: t.SignalsObjectViewLens): t.SignalsObjectViewLens {
  return {
    path: v.path,
    field: v.field.trim(),
  };
}

/** Resolve item or generator → partial lens (errors swallowed). */
function resolveLens(item: PartialLensItem): PartialLens | undefined {
  if (Is.func(item)) {
    const res = Try.catch(item as () => PartialLens);
    return res.ok ? res.data : undefined;
  }
  return item;
}
