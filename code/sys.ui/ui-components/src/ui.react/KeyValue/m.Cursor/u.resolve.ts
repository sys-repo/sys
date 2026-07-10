import { Is, Obj, type t } from '../common.ts';
import { isGroup } from '../u/u.is.ts';

type Item = t.KeyValue.Item;
type CursorItem = t.KeyValue.Cursor.Item;

export function target(path: t.ObjectPath): t.KeyValue.Cursor.Target {
  return { path: Obj.Path.slice(path, 0) };
}

export function eql(a: t.KeyValue.Cursor.Target | undefined, b: t.KeyValue.Cursor.Target | undefined) {
  return Obj.Path.eql(a?.path, b?.path);
}

export function toScope(items: readonly Item[], path: t.ObjectPath): t.KeyValue.Cursor.Scope {
  const scopeItems = itemsAtScope(items, path);
  return {
    path: Obj.Path.slice(path, 0),
    items: toCursorItems(scopeItems, path),
  };
}

export function findItem(items: readonly Item[], nextTarget: t.KeyValue.Cursor.Target): CursorItem | undefined {
  const scope = toScope(items, Obj.Path.slice(nextTarget.path, 0, -1));
  return scope.items.find((item) => eql(item.target, nextTarget));
}

function toCursorItems(items: readonly Item[], scopePath: t.ObjectPath): CursorItem[] {
  const duplicates = duplicateIds(items);
  return items
    .map((item) => toCursorItem(item, scopePath, duplicates))
    .filter((item): item is CursorItem => !Is.nil(item));
}

function toCursorItem(
  item: Item,
  scopePath: t.ObjectPath,
  duplicateIds: ReadonlySet<string>,
): CursorItem | undefined {
  const id = item.id;
  if (!isStableId(id) || duplicateIds.has(id)) return undefined;

  const itemTarget = target(Obj.Path.joinAll(scopePath, [id]));
  const enterable = isGroup(item) && toCursorItems(item.items, itemTarget.path).length > 0;
  return { target: itemTarget, id, item, enterable };
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
