/**
 * @module
 * Pi-Driver help and DSL resources.
 */
import type { t } from './common.ts';
import { Dsl } from './u/u.load.ts';
export type * from './t.ts';

/** Pi-Driver help and DSL resource namespace. */
export const PiHelp: t.PiHelp.Lib = {
  Dsl,
};
