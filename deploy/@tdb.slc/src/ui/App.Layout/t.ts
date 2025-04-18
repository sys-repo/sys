import { type t } from './common.ts';
export type * from './t.Breakpoint.ts';

/**
 * Logical helpers for working with layouts.
 */
export type AppLayoutLib = {
  /** The screen-size breakpoint library. */
  readonly Breakpoint: t.BreakpointLib;
};
