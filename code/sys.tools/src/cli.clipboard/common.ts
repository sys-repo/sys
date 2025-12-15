import { type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const id = 'copy' satisfies t.ClipboardTool.Id;
const name = 'system/clipboard:tools' satisfies t.ClipboardTool.Name;
export const D = {
  tool: { id, name },
} as const;
