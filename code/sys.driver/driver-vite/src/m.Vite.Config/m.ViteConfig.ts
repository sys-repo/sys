import { type t, DEFAULTS, Path } from './common.ts';
import { workspace } from './u.Workspace.ts';
import { toAlias as alias } from './u.alias.ts';

const resolve = Path.resolve;
const DEF = DEFAULTS.path;

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfigLib = {
  /**
   * Output directory paths.
   */
  outDir: { default: DEF.outDir },

  /**
   * Prepare paths for the vite build.
   */
  paths(options = {}) {
    const input = resolve(options.input ?? DEF.input);
    const outDir = resolve(options.outDir ?? DEF.outDir);
    return { input, outDir };
  },

  /**
   * Configuration helpers for performing module-resolution over a `deno.json` workspace.
   */
  workspace,

  /**
   * Construct a replacement regex to use an as alias for a module/import lookup
   * within the Vite/Rollup/alias configuration.
   */
  alias,
};
