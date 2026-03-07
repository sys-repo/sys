/**
 * @module
 * TreeHost
 *
 * TreeHost is a structural UI host primitive that renders a tree-oriented
 * layout with named slots. It provides **no domain semantics** of its own.
 *
 * Responsibilities:
 * - Host a tree navigation surface alongside auxiliary and main content slots.
 * - Define the structural contract (layout + slots) only.
 *
 * Non-responsibilities:
 * - No slug resolution.
 * - No selection state ownership.
 * - No navigation policy.
 * - No stack or lifecycle behavior.
 *
 * Data adaptation:
 * - The associated `Data` surface provides **pure adapters** for transforming
 *   domain trees (e.g. slug trees) into UI–compatible <Tree> structures.
 * - Adapters are deterministic, side-effect free, and UI-agnostic.
 *
 * TreeHost is designed to be embedded within higher-level orchestration
 * primitives (e.g. SlugSheet + controllers), where meaning, navigation,
 * and recursion are defined.
 */
import { type t, TreeHost as LayoutTreeHost } from './common.ts';
import { Data } from './m.Data.ts';

/** Public TreeHost entrypoint. */
export const TreeHost: t.TreeHostLib = {
  ...LayoutTreeHost,
  Data,
};
