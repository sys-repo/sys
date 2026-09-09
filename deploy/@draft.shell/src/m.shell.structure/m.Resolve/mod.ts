/**
 * @module
 * Shell.Structure resolver.
 */
import type { t } from './common.ts';
export type * from './t.ts';

/** Resolve a parsed Shell.Structure value into its canonical root shape. */
export const resolve: t.ShellStructure.Resolve.Fn = (structure) => structure;
