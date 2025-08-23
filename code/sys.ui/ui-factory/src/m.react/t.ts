import type { t } from './common.ts';
export type * from './t.hooks.ts';

/**
 * React-specific module shape.
 * - The default export is a React component.
 * - Additional exports (if any) are ignored at runtime.
 * - Matches the shape expected by React.lazy loaders.
 */
export type ReactModule = {
  /**
   * ComponentType:
   *    Standards conformance and forward-compatibility,
   *    Compatible with functional component best practices (preferred).
   */
  readonly default: React.ComponentType<any>;
};

/**
 * Registration specialized for React.
 * - Same shape as core `Registration`, but module type is `ReactModule`.
 */
export type ReactRegistration<
  Id extends t.ViewId = t.ViewId,
  Slot extends t.SlotId = t.SlotId,
> = t.Registration<Id, Slot, ReactModule>;

/**
 * Factory specialized for React `view` registrations.
 */
export type ReactFactory<
  Id extends t.ViewId = t.ViewId,
  Slot extends t.SlotId = t.SlotId,
> = t.Factory<Id, ReactRegistration<Id, Slot>>;

/**
 * Node created by the React host adapter.
 * - Holds a React `component` + initial `{props}`.
 * - Slots are resolved at `plan → render` time by the adapter.
 */
export type ReactHostNode = {
  readonly Component: React.ComponentType<any>;
  readonly props?: unknown;
  readonly slots: Record<string, unknown>;
};

/**
 * Host adapter contract for React.
 * Bridges resolved plans into actual React elements.
 */
export type ReactHostAdapter = t.HostAdapter<ReactFactory<any, any>>;
