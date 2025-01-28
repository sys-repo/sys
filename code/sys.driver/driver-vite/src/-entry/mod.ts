/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import { type t, Args, c, DenoModule, pkg, ViteLog } from './common.ts';
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

    if (cmd === 'dev') {
      ViteLog.API.log({ cmd: 'dev' });
      return await ViteEntry.dev(args);
    }

    if (cmd === 'build') {
      if (!args.silent) ViteLog.API.log({ cmd: 'build' });
      return await ViteEntry.build(args);
    }

    if (cmd === 'serve') {
      if (!args.silent) ViteLog.API.log({ cmd: 'serve' });
      console.info();
      return await ViteEntry.serve(args);
    }

    if (cmd === 'init') {
      const { init } = await import('./u.init.ts');
      return await init(args);
    }

    if (cmd === 'help') {
      await ViteLog.Help.log({
        pkg,
        in: args.in,
        out: args.out,
        api: { disabled: ['backup'] }, // TODO 🐷 temporarily disabled until implemented (working in VitePress module).
      });
      return;
    }

    if (cmd === 'upgrade') {
      const { dir, force = false, dryRun } = args;
      await DenoModule.upgrade({
        name: pkg.name,
        currentVersion: pkg.version,
        targetVersion: args.version,
        dir,
        force,
        dryRun,
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
