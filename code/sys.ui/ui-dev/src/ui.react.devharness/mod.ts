/**
 * @module
 * React DevHarness rendering library.
 */
/** Type library (barrel file). */
export type * as t from './types.ts';

/** DevHarness aggregate API and default renderer. */
export { Harness, render } from './m.Harness/mod.ts';

/** DevHarness React hooks for keyboard and pointer-band interactions. */
export { useKeyboard, useRubberband } from './ui.use/mod.ts';
/** Component that renders an index of available DevHarness specs. */
export { ModuleList } from './ui/ModuleList/mod.ts';

/** Shared visual constants and sample text helpers for DevHarness specs. */
export { Badges, COLORS, Lorem } from './common.ts';
/** DevHarness utility modules for specs, routing, predicates, and dynamic values. */
export { DevArgs, Is, Spec, ValueHandler } from './u/mod.ts';
