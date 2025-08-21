import type { t } from './common.ts';

/** Opaque handle to the host root */
export type HostInstance = object;
/** Opaque handle per node instance */
export type HostNode = object;

/**
 * High-level rendering API.
 * Builds and tears down host trees from resolved plans via an adapter.
 */
export type RendererLib = {
  /**
   * One-shot build:
   * Walks the resolved plan depth-first, creating nodes and wiring slots.
   */
  mount<F extends t.Factory<any, any>>(
    resolved: t.ResolvedPlanNode<F>,
    adapter: HostAdapter<F>,
  ): HostInstance;

  /**
   * Teardown:
   * Traverse and remove all nodes, releasing host resources.
   */
  unmount(root: HostInstance, adapter: HostAdapter<any>): void;
};

/**
 * Adapter contract that bridges the abstract plan → concrete host.
 * Each method is invoked by the renderer as it walks the resolved tree.
 */
export type HostAdapter<F extends t.Factory<any, any>> = {
  /**
   * Create an instance for a view. Called once per ResolvedPlanNode.
   * Responsible for wiring `module.default` with its initial props.
   */
  create(node: t.ResolvedPlanNode<F>): HostNode;

  /**
   * Place a child into a parent under a named slot.
   * - Arrays preserve order.
   * - Singletons are inserted directly.
   */
  insert(parent: HostNode, slot: string, child: HostNode | readonly HostNode[]): void;

  /**
   * Update props for an existing node.
   * Optional in v1 (mount-only semantics).
   */
  update?(node: HostNode, nextProps: unknown): void;

  /**
   * Remove a node (and its subtree) from the host environment.
   */
  remove(node: HostNode): void;

  /**
   * Complete mounting and return a root-level host handle.
   */
  finalize(root: HostNode): HostInstance;
};
