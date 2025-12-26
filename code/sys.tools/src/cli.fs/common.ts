import { FsTool } from './t.namespace.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Fs } from '@sys/fs';

/**
 * Constants:
 */
const id = FsTool.ID;
const name = FsTool.NAME;
export const D = {
  tool: { id, name },
} as const;
