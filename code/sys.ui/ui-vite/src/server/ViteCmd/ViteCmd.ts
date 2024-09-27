import { defineHandler } from './ViteCmd.config.ts';
import { DEFAULTS, slug, Cmd, type t } from './common.ts';

/**
 * Vite test helpers.
 */
export const ViteCmd: t.ViteCmdLib = {
  outDir: {
    default: DEFAULTS.path.outDir,
    random: () => `${ViteCmd.outDir.default}-${slug()}`,
  },
  defineHandler,
  env(options = {}) {
    const VITE_OUTDIR = options.outDir ?? DEFAULTS.path.outDir;
    const VITE_INPUT = options.input ?? DEFAULTS.path.input;
    return { VITE_OUTDIR, VITE_INPUT };
  },
  async run(options = {}) {
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
