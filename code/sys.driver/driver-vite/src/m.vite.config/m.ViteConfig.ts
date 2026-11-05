import type { t } from './common.ts';

import { workspace } from '../m.vite.config.workspace/mod.ts';
import { Is } from './m.Is.ts';
import { toAlias as alias } from './u/u.alias.ts';
import { paths } from './u/u.paths.ts';

const define = ((config: unknown) => config) as t.ViteConfig.Lib['define'];

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfig.Lib = {
  Is,
  define,
  // Configuration execution, unlike importing this facade, loads the toolchain in the caller.
  async app(options) {
    const { app } = await import('./u/u.app.ts');
    return app(options);
  },
  alias,
  paths,
  async fromFile(configDir) {
    const { fromFile } = await import('./u/u.fromFile.ts');
    return fromFile(configDir);
  },
  workspace,
};
