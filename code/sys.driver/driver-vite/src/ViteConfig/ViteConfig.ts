import { DEFAULTS, Path, slug, type t } from './common.ts';
import { workspace } from './u.workspace.ts';

const resolve = Path.resolve;
const DEF = DEFAULTS.path;

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfigLib = {
  /**
   * Output directory paths.
   */
  outDir: {
    default: DEF.outDir,
    test: {
      base: DEF.outDirTesting,
      random(uniq) {
        const base = ViteConfig.outDir.test.base;
        return `${base}/test-${uniq ?? slug()}`;
      },
    },
  },

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
} as const;
