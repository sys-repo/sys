import { workspace } from '../m.Vite.Config.Workspace/mod.ts';
import { type t, DEFAULTS, Path } from './common.ts';
import { toAlias as alias } from './u.alias.ts';
import { app } from './u.app.ts';

const resolve = Path.resolve;
const DEF = DEFAULTS.path;

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfigLib = {
  app,
  alias,
  workspace,
  paths(options = {}) {
    const input = resolve(options.input ?? DEF.input);
    const outDir = resolve(options.outDir ?? DEF.outDir);
    return { input, outDir };
  },
};
