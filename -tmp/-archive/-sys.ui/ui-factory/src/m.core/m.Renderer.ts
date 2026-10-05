import { type t } from './common.ts';

export const Renderer: t.RendererLib = {
  mount<F extends t.Factory<any, any>>(
    resolved: t.ResolvedPlanNode<F>,
    adapter: t.HostAdapter<F>,
  ): t.HostInstance {
    /**
     * Depth-first build:
     * - `create` is called pre-order (parent before children).
     * - `insert` wires each child (or list of children) under the named slot.
     * - We record parent → children edges for later post-order teardown.
     */
    const build = (node: t.ResolvedPlanNode<F>): t.HostNode => {
      const hostNode = adapter.create(node);
      edges.set(hostNode, []);

      const entries = Object.entries(node.slots ?? {}) as Array<
        [string, t.ResolvedPlanNode<F> | ReadonlyArray<t.ResolvedPlanNode<F>>]
      >;

      for (const [slotName, childOrList] of entries) {
        if (Array.isArray(childOrList)) {
          const childNodes: t.HostNode[] = [];
          for (const c of childOrList) {
            const childNode = build(c as t.ResolvedPlanNode<F>);
            childNodes.push(childNode);
            edges.get(hostNode)!.push(childNode);
          }
          adapter.insert(hostNode, slotName, childNodes);
        } else {
          const childNode = build(childOrList as t.ResolvedPlanNode<F>);
          edges.get(hostNode)!.push(childNode);
          adapter.insert(hostNode, slotName, childNode);
        }
      }

      return hostNode;
    };

    const rootNode = build(resolved);
    const instance = adapter.finalize(rootNode);
    roots.set(instance, rootNode);
    return instance;
  },

  unmount(root: t.HostInstance, adapter: t.HostAdapter<any>): void {
    const rootNode = roots.get(root);
    if (!rootNode) return; // Already unmounted or <unknown>.
    removeSubtree(rootNode, adapter);
    roots.delete(root);
  },
};

/**
 * Helpers:
 */

/**
 * Internal edge store to support teardown.
 * We keep a parent→children map and a root-instance→root-node map.
 * Stored as WeakMaps so GC can reclaim when users drop references.
 */
const edges = new WeakMap<t.HostNode, t.HostNode[]>();
const roots = new WeakMap<t.HostInstance, t.HostNode>();

/**
 * Post-order teardown of a mounted subtree.
 *
 * Guarantees:
 * - Children are removed before their parent (post-order).
 * - Sibling subtrees are removed right-to-left (last mounted, first removed).
 * - Safe if a node has no recorded children.
 * - Idempotent: repeated calls on the same node are harmless.
 *
 * Notes:
 * - `edges` is a WeakMap<HostNode, HostNode[]> populated during `mount`.
 * - We copy the children array before recursing to avoid iterating over
 *   a structure we later delete.
 */
function removeSubtree(node: t.HostNode, adapter: t.HostAdapter<any>) {
  const children = edges.get(node) ?? [];

  // Visit sibling subtrees right-to-left so the last mounted sibling is removed first.
  for (const child of [...children].reverse()) removeSubtree(child, adapter);

  edges.delete(node); //   ← cleanup the bookkeeping.
  adapter.remove(node); // ← delegate actual host removal.
}
