import { TmplTool } from './t.namespace.ts';
import { type t } from '../common.ts';

export * from '../common.ts';
// [tmpl:variant.exports]

/**
 * Constants:
 */
const id = TmplTool.ID;
const name = TmplTool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.TmplTool.MenuCmd;
export const opt = (name: string, value: C): t.TmplTool.MenuOption => ({ name, value });
