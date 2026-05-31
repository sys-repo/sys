import type { t } from './common.ts';

import { workspace } from '../m.vite.config.workspace/mod.ts';
import { Is } from './m.Is.ts';
import { toAlias as alias } from './u.alias.ts';
import { app } from './u.app.ts';
import { fromFile } from './u.fromFile.ts';
import { paths } from './u.paths.ts';

const define = ((config: unknown) => config) as t.ViteConfig.Lib['define'];

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfig.Lib = {
  Is,
  define,
  app,
  alias,
  paths,
  fromFile,
  workspace,
};
