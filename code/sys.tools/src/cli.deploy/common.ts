import { type t, JsonFile } from '../common.ts';
import { DeployTool } from './t.namespace.ts';

/** @system: exports */
export { Process } from '@sys/process';
export { Schema } from '@sys/schema';
export { Yaml } from '@sys/yaml';

/** @local: exports */
export * from '../common.ts';

/**
 * Constants:
 */
const id = DeployTool.ID;
const name = DeployTool.NAME;
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
