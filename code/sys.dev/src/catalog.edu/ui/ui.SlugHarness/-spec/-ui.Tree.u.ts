import { type t } from '../common.ts';

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
  return items.map((item) => toTreeNode(item, [...basePath, item.name]));
}

/** Single item → TreeNode with RFC6901 key built from the semantic path. */
export function toTreeNode(item: t.SlugTreeItem, path: t.ObjectPath): t.TreeNode {
  type CanonicalItem = { readonly slugs?: readonly t.SlugTreeItem[] };
  const src = item as unknown as CanonicalItem;

  const children =
    src.slugs && src.slugs.length
      ? src.slugs.map((child) => toTreeNode(child, [...path, child.name]))
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
    key: toPointerFromPath(path),
    label: item.name,
    ...(value !== undefined ? { value } : {}),
    ...(children && children.length ? { children } : {}),
  };

  return node;
}

/** RFC6901 pointer from ObjectPath (escape "~" → "~0", "/" → "~1"). */
function toPointerFromPath(path: t.ObjectPath): string {
  if (!path?.length) return '';
  const esc = (seg: string | number) => String(seg).replace(/~/g, '~0').replace(/\//g, '~1');
  return '/' + path.map(esc).join('/');
}
