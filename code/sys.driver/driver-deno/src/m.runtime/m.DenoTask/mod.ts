/**
 * @module
 * Helpers for listing and running tasks declared in `deno.json`.
 */
import type { t } from './common.ts';
import { list } from './m.list.ts';
import { Menu } from './m.Menu/mod.ts';
import { run } from './m.run.ts';

/**
 * Deno task discovery and dispatch helpers.
 */
export const DenoTask: t.DenoTask.Lib = {
  list,
  run,
  Menu,
};

