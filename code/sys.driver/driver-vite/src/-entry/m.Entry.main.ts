import { Wrangle } from '../m.vite/u/u.wrangle.ts';
import { Args, c, Path, pkg, type t, ViteLog } from './common.ts';

import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

type O = Record<string, unknown>;

export const main: t.ViteEntry.Lib['main'] = async (input) => {
  const argsAsType = <T extends O>() => wrangle.args<T>((input ?? Deno.args) as string[]);
  const args = argsAsType<t.ViteEntry.Args>();
  const cmd = args.cmd;

  if (cmd === 'dev') {
    ViteLog.Tasks.log({ cmd: 'dev' });
    await dev(args);
    return;
  }

  if (cmd === 'build') {
    if (!args.silent) ViteLog.Tasks.log({ cmd: 'build' });
    await build(args);
    return;
  }

  if (cmd === 'serve') {
    if (!args.silent) ViteLog.Tasks.log({ cmd: 'serve' });
    console.info();
    await serve(args);
    return;
  }

  if (cmd === 'info') {
    const { dir, info } = args;
    const paths = await Wrangle.pathsFromConfigfile(dir);
    const dirs = {
      in: Path.join(paths.cwd, paths.app.entry),
      out: Path.join(paths.cwd, paths.app.outDir),
    };

    let tasks: false | undefined;
    if (info === true) tasks = false; // NB: don't show common tasks if specific "info" was requested.

    await ViteLog.Help.log({ pkg, dirs, tasks });
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${c.yellow(c.bold(cmd))}" is not supported.`);
};

/**
 * Helpers
 */
const wrangle = {
  args<T extends O>(argv: string[] | T) {
    return Array.isArray(argv) ? Args.parse<T>(argv) : (argv as T);
  },
} as const;
