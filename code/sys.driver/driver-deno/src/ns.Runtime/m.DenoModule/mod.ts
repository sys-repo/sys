/**
 * Tools for working with a Deno module/app, namely something that
 * has a `deno.json` file and can be `upgraded` against a registry.
 * @module
 */
import type { DenoModuleLib } from './t.ts';

import { backup } from './u.backup.ts';
import { upgrade } from './u.upgrade.ts';

export const DenoModule: DenoModuleLib = {
  upgrade,
  backup,
};
