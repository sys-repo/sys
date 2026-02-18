import { __NAME__Tool } from './t.namespace.ts';
import { type t } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const id = __NAME__Tool.ID;
const name = __NAME__Tool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.__NAME__Tool.MenuCmd;
export const opt = (name: string, value: C): t.__NAME__Tool.MenuOption => ({ name, value });
