/**
 * @module
 * Shell.Structure contracts and pure parsing pipeline.
 */
import { parse } from './m.Parse/mod.ts';
import { resolve } from './m.Resolve/mod.ts';
import { Schema } from './m.Schema/mod.ts';
import type { t } from './common.ts';

export type * from './t.ts';

/** Public Shell.Structure library surface. */
export const ShellStructure: t.ShellStructure.Lib = {
  Schema,
  parse,
  resolve,
};
