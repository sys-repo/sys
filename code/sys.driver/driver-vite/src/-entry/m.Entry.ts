/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import { type t, Args, c, DenoModule, pkg, Vite, ViteLog } from './common.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

export const ViteEntry: t.ViteEntryLib = {
  dev,
  build,
  serve,

  async main(input) {
    const args = wrangle.args(input ?? Deno.args);
    const cmd = args.cmd;

    if (cmd === 'init') {
      const { init } = await import('./u.init.ts');
      await init(args);
      return;
    }

    if (cmd === 'dev') {
      ViteLog.API.log({ cmd: 'dev' });
      await ViteEntry.dev(args);
      return;
    }

    if (cmd === 'build') {
      if (!args.silent) ViteLog.API.log({ cmd: 'build' });
      await ViteEntry.build(args);
      return;
    }

    if (cmd === 'serve') {
      if (!args.silent) ViteLog.API.log({ cmd: 'serve' });
      console.info();
      await ViteEntry.serve(args);
      return;
    }

    if (args.cmd === 'clean') {
      const { clean } = await import('./u.clean.ts');
      await clean(args);
      return;
    }

    if (cmd === 'help') {
      await ViteLog.Help.log({
        pkg,
        in: args.in,
        out: args.out,
      });
      return;
    }

    if (cmd === 'backup') {
      const { dir = '.', includeDist, force } = args;
      console.info();
      await Vite.backup({ dir, includeDist, force });
      console.info();
      return;
    }

    if (cmd === 'upgrade') {
      const { dir = '.', force = false, dryRun } = args;
      await DenoModule.upgrade({
        name: pkg.name,
        currentVersion: pkg.version,
        targetVersion: args.version,
        dir,
        force,
        dryRun,
        async beforeUpgrade({ message }) {
          console.info();
          await Vite.backup({ dir, includeDist: false, message });
        },
      });
      return;
    }

    // Command not matched.
    console.error(`The given --cmd="${c.yellow(c.bold(cmd))}" is not supported.`);
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
