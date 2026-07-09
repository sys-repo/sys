import { Is, Obj, type t } from '../common.ts';
import { isGroup } from '../u/u.is.ts';

type Item = t.KeyValue.Item;
type FocusItem = t.KeyValue.Focus.Item;

export function ref(path: t.ObjectPath): t.KeyValue.Focus.Ref {
  return { path: Obj.Path.slice(path, 0) };
}

export function eql(a: t.KeyValue.Focus.Ref | undefined, b: t.KeyValue.Focus.Ref | undefined) {
  return Obj.Path.eql(a?.path, b?.path);
}

export function toScope(items: readonly Item[], path: t.ObjectPath): t.KeyValue.Focus.Scope {
  const scopeItems = itemsAtScope(items, path);
  return {
    path: Obj.Path.slice(path, 0),
    items: toFocusItems(scopeItems, path),
  };
}

export function findItem(items: readonly Item[], target: t.KeyValue.Focus.Ref): FocusItem | undefined {
  const scope = toScope(items, Obj.Path.slice(target.path, 0, -1));
  return scope.items.find((item) => eql(item.ref, target));
}

function toFocusItems(items: readonly Item[], scopePath: t.ObjectPath): FocusItem[] {
  const duplicates = duplicateIds(items);
  return items
    .map((item) => toFocusItem(item, scopePath, duplicates))
    .filter((item): item is FocusItem => !Is.nil(item));
}

function toFocusItem(
  item: Item,
  scopePath: t.ObjectPath,
  duplicateIds: ReadonlySet<string>,
): FocusItem | undefined {
  const id = item.id;
  if (!isStableId(id) || duplicateIds.has(id)) return undefined;

  const itemRef = ref(Obj.Path.joinAll(scopePath, [id]));
  const enterable = isGroup(item) && toFocusItems(item.items, itemRef.path).length > 0;
  return { ref: itemRef, id, item, enterable };
}

function itemsAtScope(items: readonly Item[], path: t.ObjectPath): readonly Item[] {
  if (path.length === 0) return items;

  const [head, ...tail] = path;
  if (!isStableId(head)) return [];
  if (duplicateIds(items).has(head)) return [];

  const item = items.find((candidate) => candidate.id === head);
  if (!item || !isGroup(item)) return [];
  return itemsAtScope(item.items, tail);
}

function duplicateIds(items: readonly Item[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  items.forEach((item) => {
    const id = item.id;
    if (!isStableId(id)) return;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  });

  return duplicates;
}

function isStableId(id: unknown): id is string {
  return Is.string(id) && !Is.blank(id);
}
