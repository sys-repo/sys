import { ClipboardTool } from './t.namespace.ts';

export * from '../common.ts';
export { Git } from '@sys/driver-process/git';

/**
 * Constants:
 */
const id = ClipboardTool.ID;
const name = ClipboardTool.NAME;
export const D = {
  tool: { id, name },
} as const;
