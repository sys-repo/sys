import { UpdateTool } from './t.namespace.ts';
import { type t } from './common.ts';

export * from '../common.ts';

/**
 * Libs:
 */
export { Fs } from '@sys/fs';
export { Semver } from '@sys/std/semver';

/**
 * Constants:
 */
export const id = UpdateTool.ID;
export const name = UpdateTool.NAME;
export const D = {
  tool: { id, name },
} as const;
