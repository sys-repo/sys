import { type t, Arr, Is, Obj } from './common.ts';

type LabelMode = Exclude<t.LayoutTreeSplitFromSlugTreeOpts['label'], undefined>;

export const Data: t.LayoutTreeSplitDataLib = {
  fromSlugTree(tree, opts) {
    const mode: LabelMode = opts?.label ?? 'slug';
    return tree.map((item) => toNode(item, [], mode));
  },
};

/**
 * Helpers
 */
function toLabel(item: t.SlugTreeItem, mode: LabelMode): string {
  const desc = 'description' in item && Is.str(item.description) ? item.description : undefined;
  if (mode === 'slug+description' && desc && desc.length > 0) return `${item.slug} — ${desc}`;
  return item.slug;
}

function toValue(item: t.SlugTreeItem) {
  const payload: {
    slug: string;
    ref?: string;
    description?: string;
    traits?: readonly t.SlugTrait[];
    data?: { readonly [key: string]: unknown };
  } = { slug: item.slug };

  if ('ref' in item && Is.str(item.ref)) payload.ref = item.ref;
  if ('description' in item && Is.str(item.description)) payload.description = item.description;
  if ('traits' in item && Arr.isArray(item.traits) && item.traits.length > 0)
    payload.traits = item.traits;
  if ('data' in item && Is.record(item.data)) payload.data = item.data;

  return payload;
}

function toNode(item: t.SlugTreeItem, parentPath: t.ObjectPath, labelMode: LabelMode): t.TreeNode {
  const path = [...parentPath, item.slug] as t.ObjectPath;
  const node: t.TreeNode = {
    path,
    key: Obj.Path.encode(path),
    label: toLabel(item, labelMode),
    value: toValue(item),
  };

  const children =
    Arr.isArray(item.slugs) && item.slugs.length > 0
      ? item.slugs.map((child) => toNode(child, path, labelMode))
      : undefined;

  if (children?.length) node.children = children;
  return node;
}
