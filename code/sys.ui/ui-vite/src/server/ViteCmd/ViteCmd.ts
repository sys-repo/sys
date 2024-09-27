import { defineHandler } from './ViteCmd.config.ts';
import { DEFAULTS, slug, Cmd, type t } from './common.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const ViteCmd: t.ViteCmdLib = {
  /**
   * The configuration definition handler passed to vite.
   */
  defineHandler,

  /**
   * Output directory paths.
   */
  outDir: {
    default: DEFAULTS.path.outDir,
    test: {
      base: DEFAULTS.path.outDirTest,
      random: () => `${ViteCmd.outDir.test.base}-${slug()}`,
    },
  },

  /**
   * Prepares a set of known env-vars to hand to the child process.
   */
  env(options = {}) {
    const VITE_INPUT = options.input ?? DEFAULTS.path.input;
    const VITE_OUTDIR = options.outDir ?? DEFAULTS.path.outDir;
    return { VITE_INPUT, VITE_OUTDIR };
  },

  /**
   * Run the given command
   */
  async build(options = {}) {
    const env = ViteCmd.env(options);
    const configFile = DEFAULTS.path.configFile;
    const cmd = `deno run -A --node-modules-dir npm:vite build --config=${configFile}`;
    const args = cmd.split(' ').slice(1);
    const output = await Cmd.run(args, { env });
    return {
      cmd,
      output,
      paths: { outDir: env.VITE_OUTDIR },
      toString: () => output.toString(),
    };
  },
} as const;
