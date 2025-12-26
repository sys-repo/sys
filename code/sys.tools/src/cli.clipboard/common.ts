import { ClipboardTool } from './t.namespace.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const id = ClipboardTool.ID;
const name = ClipboardTool.NAME;
export const D = {
  tool: { id, name },
} as const;
