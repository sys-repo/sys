import { Workspace } from '@sys/workspace';
import { CompletionHang } from '@sys/workspace/run';
import { Args, Is, Str } from './common.ts';

type HelpArgs = {
  readonly help?: boolean | readonly boolean[];
};

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
  Deno.exitCode = result.ok ? 0 : 1;
  CompletionHang.armWarning({ result, strategy: args.strategy });
}

function wantsHelp(argv: readonly string[]) {
  const parsed = Args.parse<HelpArgs>(argv.filter((value) => value !== '--'), {
    boolean: ['help'],
    alias: { h: 'help' },
    unknown: () => true,
  });
  const help = parsed.help;
  return Is.array(help) ? help.some((value) => value === true) : help === true;
}

function help() {
  return Str.dedent(`
    Workspace test runner

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
      For runner DSL guidance: deno run -ER jsr:@sys/workspace dsl test
  `);
}

export function defaultTestArgs(argv: readonly string[]) {
  const args = argv.filter((value) => value !== '--');
  return hasParallelFlag(args) ? args : ['--parallel', ...args];
}

export function hasParallelFlag(argv: readonly string[]) {
  return argv.some((value) => value === '--parallel' || value.startsWith('--parallel='));
}

if (import.meta.main) await main();
