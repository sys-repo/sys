import { TmplTool } from './t.namespace.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const id = TmplTool.ID;
const name = TmplTool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
} as const;
