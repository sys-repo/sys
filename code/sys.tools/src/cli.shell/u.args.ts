import { Args, type t } from './common.ts';

/** Parse @sys/tools shell argv into a typed command shape. */
export function parseArgs(argv: readonly string[]): t.ShellTool.CliParsedArgs {
  const args = Args.parse<t.ShellTool.CliArgs>([...argv], { alias: { h: 'help' } });
  const parts = args._.map((part) => String(part));
  const head = parts[0];
  return {
    ...args,
    command: head === 'doctor' || head === 'alias' || head === 'path' || head === 'init' ||
        head === 'apply'
      ? head
      : undefined,
    alias: parseAliasCommand(parts),
    path: parsePathCommand(parts),
  };
}

export function shellFlag(value?: string): t.ShellTool.PosixDialect | undefined {
  if (value === 'zsh' || value === 'bash' || value === 'posix') return value;
  return undefined;
}

export function stringFlag(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Helpers:
 */
function parseAliasCommand(parts: readonly string[]): t.ShellTool.Alias.ParsedCommand | undefined {
  if (parts[0] !== 'alias') return undefined;
  if (parts[1] === 'list') return { command: 'list' };
  if (parts[1] === 'enable') return { command: 'enable', target: aliasTarget(parts[2]) };
  return undefined;
}

function aliasTarget(value?: string): t.ShellTool.Alias.Target | undefined {
  if (value === 'sys' || value === 'common') return value;
  return undefined;
}

function parsePathCommand(parts: readonly string[]): t.ShellTool.Path.ParsedCommand | undefined {
  if (parts[0] !== 'path') return undefined;
  if (parts[1] === 'list') return { command: 'list' };
  if (parts[1] === 'add') return { command: 'add', target: pathTarget(parts[2]) };
  return undefined;
}

function pathTarget(value?: string): t.ShellTool.Path.Target | undefined {
  if (value === 'deno') return value;
  return undefined;
}
