import { type t, Is, Num } from '../common.ts';

type OrderIndex = Map<string, readonly string[]>;

export const reindex: t.SlugTree.Reindex = (args) => {
  const keyMode = args.opts?.key ?? 'auto';
  const order = indexOrder(args.prev, keyMode);
  return reindexList(args.next, order, [], keyMode);
};

function reindexList(
  nodes: t.SlugTreeItems,
  order: OrderIndex,
  parentPath: readonly string[],
  keyMode: NonNullable<t.SlugTree.ReindexOpts['key']>,
): t.SlugTreeItems {
  const pathKey = pathKeyOf(parentPath);
  const orderList = order.get(pathKey) ?? [];
  const rank = new Map(orderList.map((key, i) => [key, i]));

  const ordered = withStableOrder(nodes, rank, keyMode);
  return ordered.map((node) => {
    const nextPath = [...parentPath, nodeKey(node, keyMode)];
    const slugs = node.slugs ? reindexList(node.slugs, order, nextPath, keyMode) : undefined;
    if (!slugs) return node;
    return { ...node, slugs };
  });
}

function withStableOrder(
  nodes: t.SlugTreeItems,
  rank: Map<string, number>,
  keyMode: NonNullable<t.SlugTree.ReindexOpts['key']>,
): t.SlugTreeItems {
  const rows = nodes.map((node, index) => ({
    node,
    index,
    rank: rank.get(nodeKey(node, keyMode)),
  }));

  return rows.toSorted((a, b) => {
    const ar = a.rank ?? Num.INFINITY;
    const br = b.rank ?? Num.INFINITY;
    if (ar !== br) return ar - br;
    return a.index - b.index;
  }).map((row) => row.node);
}

function indexOrder(tree: t.SlugTreeItems, keyMode: NonNullable<t.SlugTree.ReindexOpts['key']>): OrderIndex {
  const order = new Map<string, readonly string[]>();

  walk(tree, [], keyMode, (parentPath, node) => {
    const key = nodeKey(node, keyMode);
    const pathKey = pathKeyOf(parentPath);
    const list = order.get(pathKey) ?? [];
    order.set(pathKey, [...list, key]);
  });

  return order;
}

function walk(
  nodes: t.SlugTreeItems,
  parentPath: readonly string[],
  keyMode: NonNullable<t.SlugTree.ReindexOpts['key']>,
  visit: (parent: readonly string[], node: t.SlugTreeItem) => void,
) {
  for (const node of nodes) {
    visit(parentPath, node);
    if (node.slugs) {
      const nextPath = [...parentPath, nodeKey(node, keyMode)];
      walk(node.slugs, nextPath, keyMode, visit);
    }
  }
}

function nodeKey(node: t.SlugTreeItem, keyMode: NonNullable<t.SlugTree.ReindexOpts['key']>): string {
  if (keyMode === 'ref') return hasRef(node) ? node.ref : node.slug;
  if (keyMode === 'slug') return node.slug;
  return hasRef(node) ? node.ref : node.slug;
}

function hasRef(node: t.SlugTreeItem): node is t.SlugTreeItemRefOnly {
  return Is.str((node as { ref?: unknown }).ref);
}

function pathKeyOf(parts: readonly string[]): string {
  return parts.join('::');
}
