import { Is } from '@sys/std/is';
import { type t } from './common.ts';
import { Imports } from './u.imports.ts';

type CliFn = (
  cwd: t.StringDir,
  argv: readonly string[],
  context: t.Root.ToolCliContext,
) => Promise<unknown>;

/**
 * Load a tool module and return its `cli(cwd, argv[, context])` entry.
 */
async function loadCli(command: t.Root.Command): Promise<CliFn> {
  const mod = await Imports[command]();
  const cli = (mod as { readonly cli?: unknown } | null | undefined)?.cli;

  if (!Is.func(cli)) {
    throw new Error(`Tool "${command}" does not export cli(cwd, argv[, context])`);
  }

  return cli as CliFn;
}

/**
 * Dispatch a root command to its tool entrypoint.
 */
export async function dispatchRootCommand(
  cwd: t.StringDir,
  command: t.Root.Command,
  argv: readonly string[],
  context: t.Root.ToolCliContext = { origin: 'argv' },
) {
  const cli = await loadCli(command);
  return await cli(cwd, argv.slice(1), context);
}
