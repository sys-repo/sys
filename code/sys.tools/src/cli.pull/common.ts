import { PullTool } from './t.namespace.ts';
import { type t } from '../common.ts';

export * from '../common.ts';
export { Schema } from '@sys/schema';
export { Http } from '@sys/http/server';

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
