import { Workspace } from '@sys/workspace';

export async function main() {
  if (wantsHelp(Deno.args)) {
    console.info(help());
    return;
  }

  const args = Workspace.Run.Args.test(Deno.args);
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
  deno task test -- --parallel
  deno task test -- --parallel --jobs=auto
  deno task test -- --parallel --jobs=<n>

Options:
  --parallel       run package tests with the topo-safe parallel scheduler
  --jobs=auto      use the bounded automatic worker count with --parallel
  --jobs=<n>       run at most n package tests at once with --parallel
  -h, --help       show this help

Notes:
  deno task test remains the serial baseline.
  @sys/workspace flags live after -- and are distinct from Deno task flags.
  --jobs without --parallel is invalid.
  For runner DSL guidance: deno run -ER jsr:@sys/workspace dsl test`;
}

if (import.meta.main) await main();
