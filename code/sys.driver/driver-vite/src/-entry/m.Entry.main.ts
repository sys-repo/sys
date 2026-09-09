import type { t } from './common.ts';
import { Args } from '@sys/std/args';
import { Is } from '@sys/std/is';
import { COMMAND_LOADERS } from './u.command/mod.ts';

type O = Record<string, unknown>;
type CommandModule<A extends t.ViteEntry.Args> = {
  dispatch(args: A): Promise<void>;
};

export type DispatchLoaders = Readonly<{
  build(): Promise<CommandModule<t.ViteEntry.Args.Build>>;
  dev(): Promise<CommandModule<t.ViteEntry.Args.Dev>>;
  info(): Promise<CommandModule<t.ViteEntry.Args.Info>>;
  serve(): Promise<CommandModule<t.ViteEntry.Args.Serve>>;
}>;

// Preserve both fields until reconciliation can reject conflicting caller input.
const PKG_SUBPATH_FLAGS = ['pkgSubpath', 'pkg-subpath'] as const;

/**
 * Dispatch one CLI invocation without loading an unrequested command graph.
 */
export const main: t.ViteEntry.Lib['main'] = async (input) => {
  return await mainWith(input, COMMAND_LOADERS);
};

/** Internal dependency seam for deterministic command-dispatch tests. */
export async function mainWith(
  input: string[] | t.ViteEntry.Args | undefined,
  loaders: DispatchLoaders,
): Promise<void> {
  const args = wrangle.args<t.ViteEntry.Args>(input ?? Deno.args);
  const cmd = args.cmd;

  if (cmd === 'dev') {
    const { resolvePkgSubpath } = await import('./u.command/u.pkgSubpath.ts');
    resolvePkgSubpath(args);
    await (await loaders.dev()).dispatch(args);
    return;
  }

  if (cmd === 'build') {
    await (await loaders.build()).dispatch(args);
    return;
  }

  if (cmd === 'serve') {
    const { resolvePkgSubpath } = await import('./u.command/u.pkgSubpath.ts');
    resolvePkgSubpath(args);
    await (await loaders.serve()).dispatch(args);
    return;
  }

  if (cmd === 'info') {
    await (await loaders.info()).dispatch(args);
    return;
  }

  // Command not matched.
  const { c } = await import('@sys/cli/fmt');
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
