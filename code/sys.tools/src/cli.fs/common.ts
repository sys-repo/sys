import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Fs } from '@sys/fs';

/**
 * Constants:
 */
const id = 'fs' satisfies t.FsTool.Id;
const name = 'system/fs:tools' satisfies t.FsTool.Name;
export const D = {
  tool: { id, name },
} as const;
