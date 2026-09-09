import type { t } from '../common.ts';

export { Env } from '@sys/fs/env';
export { Dist } from '@sys/server/dist';
export { Schema } from '@sys/schema';
export { YamlConfig } from '@sys/yaml/cli';

export * from '../common.ts';
export type * as t from './common.t.ts';

/**
 * Constants:
 */
const id = 'pull' satisfies t.PullTool.Id;
const name = 'system/pull:tools' satisfies t.PullTool.Name;
export const D = {
  tool: { id, name },
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.PullTool.MenuCmd;
export const opt = (name: string, value: C): t.PullTool.MenuOption => ({ name, value });
