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
const id = 'update' satisfies t.UpdateTool.Id;
const name = 'system/update:tools' satisfies t.UpdateTool.Name;
export const D = {
  tool: { id, name },
} as const;
