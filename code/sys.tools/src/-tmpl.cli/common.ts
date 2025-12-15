import { type t, JsonFile } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const id = '__NAME__' satisfies t.__NAME__Tool.Id;
const name = '__NAME__' satisfies t.__NAME__Tool.Name;
export const D = {
  tool: { id, name },
  Path: {},
  Config: {
    filename: '-__NAME__.config.json',
    doc: JsonFile.default<t.__NAME__Tool.ConfigDoc>({ name }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.__NAME__Tool.Command;
export const opt = (name: string, value: C): t.__NAME__Tool.MenuOption => ({ name, value });
