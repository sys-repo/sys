import { Is, Obj, type t } from '../../common.ts';
import { isGroup } from '../../u/u.is.ts';
import { findItem, target as toTarget } from './u.resolve.ts';

type InsertResult = {
  readonly items: t.KeyValue.Item[];
  readonly current: t.KeyValue.Cursor.Target;
  readonly scope: t.ObjectPath;
  readonly index: number;
  readonly item: t.KeyValue.Item;
};

/** Insert a KeyValue item after the current cursor target in its sibling scope. */
export function insertAfter(
  args: t.KeyValue.Cursor.Insert.Args,
): t.KeyValue.Cursor.Insert.Change | undefined {
  const current = toCurrentTarget(args.current);
  if (!current) return undefined;
  if (!findItem(args.items, current)) return undefined;

  const result = insertIntoScope({
    root: args.items,
    siblings: args.items,
    current,
    createItem: args.createItem,
    scope: [],
    path: current.path,
  });
  if (!result) return undefined;

  return {
    previous: args.items,
    next: result.items,
    current,
    scope: result.scope,
    index: result.index,
    item: result.item,
  };
}

/**
 * Helpers:
 */
function insertIntoScope(args: {
  readonly root: readonly t.KeyValue.Item[];
  readonly siblings: readonly t.KeyValue.Item[];
  readonly current: t.KeyValue.Cursor.Target;
  readonly createItem: t.KeyValue.Cursor.Insert.CreateItem | t.KeyValue.Item;
  readonly scope: t.ObjectPath;
  readonly path: t.ObjectPath;
}): InsertResult | undefined {
  const [head, ...tail] = args.path;
  if (!Is.string(head) || Is.blank(head)) return undefined;

  const itemIndex = args.siblings.findIndex((item) => item.id === head);
  if (itemIndex < 0) return undefined;

  if (tail.length === 0) {
    const index = itemIndex + 1;
    const item = toInsertItem(args.createItem, {
      items: args.root,
      siblings: args.siblings,
      current: args.current,
      scope: Obj.Path.slice(args.scope, 0),
      index,
      after: args.siblings[itemIndex],
    });
    if (!item) return undefined;

    return {
      current: args.current,
      scope: Obj.Path.slice(args.scope, 0),
      index,
      item,
      items: [
        ...args.siblings.slice(0, index),
        item,
        ...args.siblings.slice(index),
      ],
    };
  }

  const parent = args.siblings[itemIndex];
  if (!isGroup(parent)) return undefined;

  const child = insertIntoScope({
    root: args.root,
    siblings: parent.items,
    current: args.current,
    createItem: args.createItem,
    scope: Obj.Path.joinAll(args.scope, [head]),
    path: tail,
  });
  if (!child) return undefined;

  return {
    ...child,
    items: [
      ...args.siblings.slice(0, itemIndex),
      { ...parent, items: child.items },
      ...args.siblings.slice(itemIndex + 1),
    ],
  };
}

function toCurrentTarget(
  current: t.KeyValue.Cursor.Target | undefined,
): t.KeyValue.Cursor.Target | undefined {
  if (!current) return undefined;
  return toTarget(current.path, current.part);
}

function toInsertItem(
  createItem: t.KeyValue.Cursor.Insert.CreateItem | t.KeyValue.Item,
  args: t.KeyValue.Cursor.Insert.CreateItemArgs,
): t.KeyValue.Item | undefined {
  return Is.func(createItem) ? createItem(args) : createItem;
}
