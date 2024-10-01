import { DEFAULTS, Path, slug, type t } from './common.ts';

const resolve = Path.resolve;

export const Config: t.ViteCmdConfig = {
  /**
   * Output directory paths.
   */
  outDir: {
    default: DEFAULTS.path.outDir,
    test: {
      base: DEFAULTS.path.outDirTest,
      random: (uniq) => `${Config.outDir.test.base}-${uniq ?? slug()}`,
    },
  },

  /**
   * Prepare paths for the vite build.
   */
  paths(options = {}) {
    const DEF = DEFAULTS.path;
    const input = resolve(options.input ?? DEF.input);
    const outDir = resolve(options.outDir ?? DEF.outDir);
    return { input, outDir };
  },

  /**
   * Prepares a set of known env-vars to hand to the child process.
   */
  env(options = {}) {
    const paths = Config.paths(options);
    const VITE_INPUT = paths.input;
    const VITE_OUTDIR = paths.outDir;
    return { VITE_INPUT, VITE_OUTDIR };
  },
};
