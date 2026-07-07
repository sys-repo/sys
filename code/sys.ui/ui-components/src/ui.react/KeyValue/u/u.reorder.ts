import { type t, Is } from '../common.ts';

/**
 * Resolved reorder identity model.
 */
export type ReorderModel = {
  readonly ids: string[];
  readonly items: readonly t.KeyValue.Item[];
  readonly byId: ReadonlyMap<string, t.KeyValue.Item>;
};

/**
 * Resolve a safe controlled-reorder model, or undefined when identity is invalid.
 */
export function toReorderModel(
  items: t.KeyValue.Item[],
  reorder?: t.KeyValue.Reorder,
): ReorderModel | undefined {
  const getItemId = reorder?.getItemId;
  const ids = items.map((item, index) => getItemId?.(item, index) ?? item.id);
  if (!ids.every(isId)) return undefined;

  const unique = new Set(ids);
  if (unique.size !== ids.length) return undefined;

  const byId = new Map<string, t.KeyValue.Item>();
  ids.forEach((id, index) => byId.set(id, items[index]));

  return { ids, items, byId };
}

/**
 * Convert reordered IDs back to caller-owned items, preserving immutable array semantics.
 */
export function toReorderedItems(
  ids: readonly string[],
  byId: ReadonlyMap<string, t.KeyValue.Item>,
): t.KeyValue.Item[] | undefined {
  if (ids.length !== byId.size) return undefined;
  if (new Set(ids).size !== ids.length) return undefined;

  const next: t.KeyValue.Item[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item) return undefined;
    next.push(item);
  }
  return next;
}

/**
 * Check whether two reorder ID lists are identical.
 */
export function sameIds(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

function isId(id: string | undefined): id is string {
  return Is.string(id) && id.length > 0;
}
