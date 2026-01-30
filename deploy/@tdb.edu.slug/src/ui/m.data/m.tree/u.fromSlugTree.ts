import { type t, Arr, Is, Obj } from '../common.ts';

type LabelMode = Exclude<t.TreeDataFromSlugTreeOpts['label'], undefined>;

export const fromSlugTree: t.TreeDataLib['fromSlugTree'] = (tree, opts) => {
  const mode: LabelMode = opts?.label ?? 'slug';
  const leafChildren = toLeafChildren(opts?.leafChildren);
  return tree.map((item) => toNode(item, [], mode, leafChildren));
};

/**
 * Helpers
 */
function toLabel(item: t.SlugTreeItem, mode: LabelMode): string {
  const desc = 'description' in item && Is.str(item.description) ? item.description : undefined;
  if (mode === 'slug+description' && desc && desc.length > 0) return `${item.slug} — ${desc}`;
  return item.slug;
}

function toValue(item: t.SlugTreeItem): t.SlugTreeItem {
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

function toNode(
  item: t.SlugTreeItem,
  parentPath: t.ObjectPath,
  labelMode: LabelMode,
  leafChildren: (item: t.SlugTreeItem) => boolean,
): t.TreeHostViewNode {
  const path = [...parentPath, item.slug] as t.ObjectPath;
  const hasChildren = Arr.isArray(item.slugs) && item.slugs.length > 0;
  const children = hasChildren
    ? item.slugs.map((child) => toNode(child, path, labelMode, leafChildren))
    : leafChildren(item)
      ? []
      : undefined;

  const node: t.TreeHostViewNode = {
    path,
    key: Obj.Path.encode(path),
    label: toLabel(item, labelMode),
    value: toValue(item),
    ...(children !== undefined ? { children } : {}),
  };

  if ('description' in item && Is.str(item.description)) {
    node.meta = { ...(node.meta ?? {}), description: item.description };
  }
  return node;
}

function toLeafChildren(
  input: t.TreeDataFromSlugTreeOpts['leafChildren'],
): (item: t.SlugTreeItem) => boolean {
  if (Is.func(input)) return input;
  if (Is.bool(input)) return () => input;
  return (item) => 'ref' in item && Is.str(item.ref) && item.ref.length > 0;
}
