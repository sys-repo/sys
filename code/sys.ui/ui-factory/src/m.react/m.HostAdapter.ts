import React from 'react';

import { type t } from '../m.core/common.ts';
import type { ReactHostAdapterFactory, ReactHostNode } from './t.ts';

/**
 * React adapter implementing the core HostAdapter using React elements.
 */
export const ReactHostAdapter: ReactHostAdapterFactory = <F extends t.Factory<any, any>>() => ({
  create(resolved: t.ResolvedPlanNode<F>): t.HostNode {
    const Component = (resolved.module.default ?? (() => null)) as React.ComponentType<any>;
    const node: ReactHostNode = { Component, props: resolved.props, slots: {} };
    return node as unknown as t.HostNode;
  },

  insert(parent: t.HostNode, slot: string, child: t.HostNode | readonly t.HostNode[]): void {
    const p = parent as unknown as ReactHostNode;
    if (Array.isArray(child)) {
      // Clone array to avoid external mutation:
      p.slots[slot] = (child as unknown as ReactHostNode[]).slice();
    } else {
      p.slots[slot] = child as unknown as ReactHostNode;
    }
  },

  update(_node: t.HostNode, _nextProps: unknown): void {
    /**
     * v1: noop.
     * Future: diff props + patch React element tree without full remount.
     */
  },

  remove(_node: t.HostNode): void {
    /**
     * v1: noop.
     * Core Renderer handles traversal; React unmount happens at the root.
     */
  },

  finalize(root: t.HostNode): t.HostInstance {
    const element = toElement(root as unknown as ReactHostNode);
    return { element } as unknown as t.HostInstance; // conforms to ReactHostInstance & core HostInstance
  },
});

/**
 * Helpers:
 */

/** Build a React element tree from an internal ReactHostNode. */
function toElement(node: ReactHostNode): React.ReactElement {
  const slotProps: Record<string, unknown> = {};
  for (const [slot, childOrList] of Object.entries(node.slots)) {
    if (Array.isArray(childOrList)) {
      slotProps[slot] = (childOrList as readonly ReactHostNode[]).map((c) => toElement(c));
    } else {
      slotProps[slot] = toElement(childOrList as ReactHostNode);
    }
  }
  return React.createElement(node.Component, { ...(node.props as any), ...slotProps });
}
