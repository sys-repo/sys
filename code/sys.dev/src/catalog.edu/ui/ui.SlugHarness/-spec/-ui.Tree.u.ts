import { type t, Obj } from '../common.ts';

/**
 * TODO 🐷 - clean up conversion method
 * sample (first draft) below.
 */

/**
 * Convert canonical SlugTree props → TreeNode list for <IndexTree>.
 * Path is semantic (labels), not structural (no "items/i" segments).
 */
export function toTreeStructure(
  input: t.SlugTreeProps,
  basePath: t.ObjectPath = [],
): t.TreeNodeList {
  const items = input?.slugs ?? [];
  return items.map((item) => toTreeNode(item, Obj.Path.join(basePath, [item.name])));
}

/** Single item → TreeNode with RFC6901 key built from the semantic path. */
export function toTreeNode(item: t.SlugTreeItem, path: t.ObjectPath): t.TreeNode {
  type CanonicalItem = { readonly slugs?: readonly t.SlugTreeItem[] };
  const src = item as unknown as CanonicalItem;

  const children =
    src.slugs && src.slugs.length
      ? src.slugs.map((child) => toTreeNode(child, Obj.Path.join(path, [child.name])))
      : undefined;

  // Normalize value:
  //  -  ref only  → "crdt:..." (string)
  //  -  description only → string
  //  -  both → { ref, description }
  let value: unknown = undefined;
  if (item.ref && item.description) value = { ref: item.ref, description: item.description };
  else if (item.ref) value = item.ref;
  else if (item.description) value = item.description;

  const node: t.TreeNode = {
    path,
    key: Obj.Path.encode(path, { codec: 'pointer' }),
    label: item.name,
    ...(value !== undefined ? { value } : {}),
    ...(children && children.length ? { children } : {}),
  };

  return node;
}
