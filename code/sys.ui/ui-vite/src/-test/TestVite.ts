import { Cmd } from '@sys/std-s';
import { defineHandler } from './TestVite.config.ts';
import { DEFAULTS, slug, type t } from './common.ts';

/**
 * Vite test helpers.
 */
export const TestVite: t.TestViteLib = {
  outDir: {
    default: DEFAULTS.outDir,
    random: () => `${TestVite.outDir.default}-${slug()}`,
  },
  defineHandler,
  env(options = {}) {
    const VITE_OUTDIR = options.outDir ?? DEFAULTS.outDir;
    return { VITE_OUTDIR };
  },
  async run(options = {}) {
    const env = TestVite.env(options);
    const cmd = `deno task test:vite build --config=${DEFAULTS.configFilePath}`;
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
