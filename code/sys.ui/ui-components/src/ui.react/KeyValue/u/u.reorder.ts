import { type t, Is } from '../common.ts';

/**
 * Resolved direct-child reorder identity model.
 *
 * Reorder operates only on the item list supplied to this model. Recursive
 * `group.items` remain owned by the group and are not parent-level drag items.
 */
export type ReorderModel = {
  readonly ids: string[];
  readonly items: readonly t.KeyValue.Item[];
  readonly byId: ReadonlyMap<string, t.KeyValue.Item>;
};

/**
 * Resolve a safe controlled-reorder model for one direct `items` list, or
 * undefined when direct-child identity is invalid.
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
 * Convert reordered direct-child IDs back to caller-owned items, preserving
 * immutable array semantics and group item identity.
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
  return Is.string(id) && !Is.blank(id);
}
