import { defineHandler } from './TestVite.config.ts';
import { DEFAULTS, slug, Cmd, type t } from './common.ts';

/**
 * Vite test helpers.
 */
export const TestVite: t.TestViteLib = {
  outDir: {
    default: DEFAULTS.path.outDir,
    random: () => `${TestVite.outDir.default}-${slug()}`,
  },
  defineHandler,
  env(options = {}) {
    const VITE_OUTDIR = options.outDir ?? DEFAULTS.path.outDir;
    const VITE_INPUT = options.input ?? DEFAULTS.path.input;
    return { VITE_OUTDIR, VITE_INPUT };
  },
  async run(options = {}) {
    const env = TestVite.env(options);
    const cmd = `deno task test:vite build --config=${DEFAULTS.path.configFile}`;
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
