import type React from 'react';
import type { t } from './common.ts';

/**
 * Opaque host handles for the React adapter.
 * - ReactHostNode is an internal build node (pre-element).
 * - ReactHostInstance is what Renderer.mount(finalize) returns:
 *   a small object that contains a React element for the root.
 */
export type ReactHostNode = Readonly<{
  Component: React.ComponentType<any>;
  props?: unknown;
  /**
   * Slot children are always arrays of React elements (even singletons).
   * Consumers can safely `props[slot]?.map(...)` without branching.
   */
  slots: Record<string, ReactHostNode | readonly ReactHostNode[]>;
}>;

export type ReactHostInstance = Readonly<{
  /** The root React element produced by finalize(). */
  element: React.ReactElement;
}>;

/**
 * Factory type for creating a HostAdapter compatible with the core Renderer.
 * Keeping this as a function allows for later passing of options (eg. key strategy).
 */
export type ReactHostAdapterFactory = <F extends t.Factory<any, any>>() => t.HostAdapter<F>;

/**
 * Minimal façade component props for direct React rendering of a resolved plan.
 * (Used by ReactPlanView.)
 */
export type ReactPlanViewProps<F extends t.Factory<any, any>> = Readonly<{
  resolved: t.ResolvedPlanNode<F>;
}>;
