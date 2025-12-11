import { type t, JsonFile } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const toolname = `system/deploy:tools`;
export const D = {
  toolname,
  Path: {},
  Config: {
    filename: '-deploy.config.json',
    doc: JsonFile.default<t.DeployTool.ConfigDoc>({ name: toolname }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.DeployTool.Command;
export const opt = (name: string, value: C): t.DeployTool.MenuOption => ({ name, value });
