import { ShellTool } from './t.namespace.ts';
import { type t } from './common.ts';

export * from '../common.ts';
export { Shell } from '@sys/cli/shell';

/**
 * Constants:
 */
export const id = ShellTool.ID;
export const name = ShellTool.NAME;
export const D = {
  tool: { id, name },
} as const;
