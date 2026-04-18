import { CodeTool } from './t.namespace.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const id = CodeTool.ID;
const name = CodeTool.NAME;
export const D = {
  tool: { id, name },
} as const;
