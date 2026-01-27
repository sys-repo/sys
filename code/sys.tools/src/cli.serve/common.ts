import type { t } from '../common.ts';
import { ServeTool } from './t.namespace.ts';

/**
 * Libs:
 */
export { Schema } from '@sys/schema';
export { Yaml } from '@sys/yaml';
export * from '../common.ts';
export { Http, serveFileWithEtag } from '@sys/http/server';

/**
 * Constants:
 */
const id = ServeTool.ID;
const name = ServeTool.NAME;
export const D = {
  tool: { id, name },
  port: 4040,
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.ServeTool.Command;
export const opt = (name: string, value: C): t.ServeTool.MenuOption => ({ name, value });
