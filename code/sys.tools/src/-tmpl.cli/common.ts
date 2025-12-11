import { type t, JsonFile } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const toolname = `__NAME__`;
export const D = {
  toolname,
  Path: {},
  Config: {
    filename: '-__NAME__.config.json',
    doc: JsonFile.default<t.__NAME__Tool.ConfigDoc>({ name: toolname }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.__NAME__Tool.Command;
export const opt = (name: string, value: C): t.__NAME__Tool.MenuOption => ({ name, value });
