import { Workspace } from '@sys/workspace';

export async function main() {
  if (wantsHelp(Deno.args)) {
    console.info(help());
    return;
  }

  const args = Workspace.Run.Args.test(defaultTestArgs(Deno.args));
  const result = await Workspace.Run.test(args);
  console.info();
  console.info(Workspace.Run.Fmt.result(result));
  console.info();
}

function wantsHelp(argv: readonly string[]) {
  return argv.includes('--help') || argv.includes('-h');
}

function help() {
  return `Workspace test runner

Usage:
  deno task test
  deno task test -- --jobs=auto
  deno task test -- --jobs=<n>
  deno task test:parallel
  deno task test:seq

Options:
  --parallel=false  run the serial package test runner
  --jobs=auto       use the bounded automatic worker count
  --jobs=<n>        run at most n package tests at once
  -h, --help        show this help

Notes:
  deno task test defaults to the topo-safe parallel scheduler.
  deno task test:parallel is the explicit parallel alias.
  deno task test:seq preserves the serial baseline.
  @sys/workspace flags live after -- and are distinct from Deno task flags.
  For runner DSL guidance: deno run -ER jsr:@sys/workspace dsl test`;
}

export function defaultTestArgs(argv: readonly string[]) {
  const args = argv.filter((value) => value !== '--');
  return hasParallelFlag(args) ? args : ['--parallel', ...args];
}

export function hasParallelFlag(argv: readonly string[]) {
  return argv.some((value) => value === '--parallel' || value.startsWith('--parallel='));
}

if (import.meta.main) await main();
