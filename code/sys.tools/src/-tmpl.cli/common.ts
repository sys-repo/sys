import { __NAME__Tool } from './t.namespace.ts';
import { type t, JsonFile } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const id = __NAME__Tool.ID;
const name = __NAME__Tool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
  Config: {
    filename: '-__NAME__.config.json',
    doc: JsonFile.default<t.__NAME__Tool.Config.Doc>({ name }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.__NAME__Tool.MenuCmd;
export const opt = (name: string, value: C): t.__NAME__Tool.MenuOption => ({ name, value });
