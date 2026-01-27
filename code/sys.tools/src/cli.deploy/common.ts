import { type t } from '../common.ts';
import { DeployTool } from './t.namespace.ts';

/** @system: exports */
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
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.DeployTool.Command;
export const opt = (name: string, value: C): t.DeployTool.MenuOption => ({ name, value });
