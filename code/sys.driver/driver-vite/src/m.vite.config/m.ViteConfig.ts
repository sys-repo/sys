import type { ViteConfigLib } from './t.ts';

import { workspace } from '../m.vite.config.workspace/mod.ts';
import { Is } from './m.Is.ts';
import { toAlias as alias } from './u.alias.ts';
import { app } from './u.app.ts';
import { fromFile } from './u.fromFile.ts';
import { paths } from './u.paths.ts';

const define = ((config: unknown) => config) as ViteConfigLib['define'];

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: ViteConfigLib = {
  Is,
  define,
  app,
  alias,
  paths,
  fromFile,
  workspace,
};
