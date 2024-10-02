import { DEFAULTS, Denofile, Path, slug, type t } from './common.ts';

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
   * Render a `deno.json` workspace into an <Info> object.
   */
  workspace(input) {
    return Denofile.workspace(input);
  },
} as const;
