import { type t, JsonFile } from '../common.ts';

export { Schema } from '@sys/schema';
export { Yaml } from '@sys/yaml';
export * from '../common.ts';

/**
 * Constants:
 */
const id = 'deploy' satisfies t.DeployTool.Id;
const name = 'system/deploy:tools' satisfies t.DeployTool.Name;

export const D = {
  tool: { id, name },
  Path: {},
  Config: {
    filename: '-deploy.config.json',
    doc: JsonFile.default<t.DeployTool.Config.Doc>({ name }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.DeployTool.Command;
export const opt = (name: string, value: C): t.DeployTool.MenuOption => ({ name, value });
