import type { t } from './common.ts';

import { c } from '@sys/cli/fmt';
import { Path } from '@sys/fs/path';
import { Args } from '@sys/std/args';
import { Is } from '@sys/std/is';

import { Help } from '../m.fmt/u.Help.ts';
import { Tasks } from '../m.fmt/u.Tasks.ts';
import { Wrangle } from '../m.vite/u/u.wrangle.ts';
import { pkg } from '../pkg.ts';

import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { resolvePkgSubpath } from './u.pkgSubpath.ts';
import { serve } from './u.serve.ts';

type O = Record<string, unknown>;
type CommandDependencies = Pick<t.ViteEntry.Lib, 'build' | 'dev' | 'serve'>;

// Preserve both fields until reconciliation can reject conflicting caller input.
const PKG_SUBPATH_FLAGS = ['pkgSubpath', 'pkg-subpath'] as const;
const DEFAULT_COMMANDS: CommandDependencies = Object.freeze({ build, dev, serve });

export const main: t.ViteEntry.Lib['main'] = async (input) => {
  return await mainWith(input, DEFAULT_COMMANDS);
};

/** Internal dependency seam for deterministic command-dispatch tests. */
export async function mainWith(
  input: string[] | t.ViteEntry.Args | undefined,
  commands: CommandDependencies,
) {
  const args = wrangle.args<t.ViteEntry.Args>(input ?? Deno.args);
  const cmd = args.cmd;

  if (cmd === 'dev') {
    resolvePkgSubpath(args);
    Tasks.log({ cmd: 'dev' });
    await commands.dev(args);
    return;
  }

  if (cmd === 'build') {
    if (!args.silent) Tasks.log({ cmd: 'build' });
    await commands.build(args);
    return;
  }

  if (cmd === 'serve') {
    resolvePkgSubpath(args);
    if (!args.silent) {
      Tasks.log({ cmd: 'serve' });
      console.info();
    }
    await commands.serve(args);
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

    await Help.log({ pkg, dirs, tasks });
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${c.yellow(c.bold(cmd))}" is not supported.`);
}

/**
 * Helpers
 */
const wrangle = {
  args<T extends O>(argv: string[] | T) {
    return Is.array(argv) ? Args.parse<T>(argv, { string: [...PKG_SUBPATH_FLAGS] }) : (argv as T);
  },
} as const;
