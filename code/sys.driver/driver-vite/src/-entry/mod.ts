/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import { type t, Args, ViteLog, pkg } from './common.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

export const Entry: t.ViteEntryLib = {
  dev,
  build,
  serve,

  async main(input) {
    const args = wrangle.args(input ?? Deno.args);

    if (args.cmd === 'dev') {
      ViteLog.API.log({ cmd: 'dev' });
      return await Entry.dev(args);
    }

    if (args.cmd === 'build') {
      if (!args.silent) ViteLog.API.log({ cmd: 'build' });
      return await Entry.build(args);
    }

    if (args.cmd === 'serve') {
      if (!args.silent) ViteLog.API.log({ cmd: 'serve' });
      console.info();
      return Entry.serve(args);
    }

    if (args.cmd === 'init') {
      const { init } = await import('./u.init.ts');
      await init(args);
      return;
    }

    if (args.cmd === 'help') {
      await ViteLog.Help.log({
        pkg,
        in: args.in,
        out: args.out,
        api: { disabled: ['upgrade', 'backup'] }, // TODO 🐷 temporarily disabled until implemented (working in VitePress module).
      });
      return;
    }
  },
};

/**
 * Helpers
 */
const wrangle = {
  args(argv: string[] | t.ViteEntryArgs) {
    type T = t.ViteEntryArgs;
    return Array.isArray(argv) ? Args.parse<T>(argv) : (argv as T);
  },
} as const;
