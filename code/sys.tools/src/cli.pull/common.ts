import { type t } from '../common.ts';
import { PullTool } from './t.namespace.ts';

export { Env } from '@sys/fs/env';
export { Http } from '@sys/http/server';
export { Schema } from '@sys/schema';
export { YamlConfig } from '@sys/yaml/cli';
export * from '../common.ts';

/**
 * Constants:
 */
const id = PullTool.ID;
const name = PullTool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.PullTool.MenuCmd;
export const opt = (name: string, value: C): t.PullTool.MenuOption => ({ name, value });
