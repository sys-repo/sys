import { type t, Obj } from '../common.ts';

/**
 * Convert canonical SlugTree props → TreeNode list for <IndexTree>.
 * Path is semantic (labels), not structural (no "items/i" segments).
 */
export function toTreeStructure(
  input: t.SlugTreeProps,
  basePath: t.ObjectPath = [],
): t.TreeNodeList {
  const items: readonly t.SlugTreeItem[] = Array.isArray(input) ? input : [];
  return items.map((item) => toTreeNode(item, Obj.Path.join(basePath, [item.slug])));
}

function isRefOnly(item: t.SlugTreeItem): boolean {
  return typeof (item as { ref?: unknown }).ref === 'string';
}
function isInline(item: t.SlugTreeItem): boolean {
  return !isRefOnly(item);
}

/** Single item → TreeNode with RFC6901 key built from the semantic path. */
export function toTreeNode(item: t.SlugTreeItem, path: t.ObjectPath): t.TreeNode {
  const inline = item as t.SlugTreeItem & { readonly slugs?: readonly t.SlugTreeItem[] };
  const children =
    isInline(inline) && Array.isArray(inline.slugs) && inline.slugs.length > 0
      ? inline.slugs.map((child) => toTreeNode(child, Obj.Path.join(path, [child.slug])))
      : undefined;

  let value: unknown = undefined;
  if (isRefOnly(item)) {
    value = (item as { ref: string }).ref;
  } else {
    const desc = (item as { description?: string }).description;
    if (typeof desc === 'string' && desc.length > 0) value = desc;
  }

  const node: t.TreeNode = {
    path,
    key: Obj.Path.encode(path, { codec: 'pointer' }),
    label: item.slug,
    ...(value !== undefined ? { value } : {}),
    ...(children && children.length ? { children } : {}),
  };

  return node;
}
