import { Workspace } from '@sys/workspace';
import { CompletionHang } from '@sys/workspace/run';
import { Args, Cli, Is, Str, type t } from './common.ts';

export type TestPresentation =
  | { readonly mode: 'sequential' }
  | {
    readonly mode: 'parallel-screen';
    readonly reporter: 'screen';
    readonly detail: 'compact';
    readonly terminal: true;
  }
  | {
    readonly mode: 'parallel-log';
    readonly reporter: 'log';
    readonly detail: 'full';
    readonly terminal: false;
  };

type MainArgs = {
  argv?: readonly string[];
  interactive?: boolean;
};

type HelpArgs = {
  help?: boolean | readonly boolean[];
};

export async function main(input: MainArgs = {}) {
  const argv = input.argv ?? Deno.args;
  if (wantsHelp(argv)) {
    console.info(help());
    return;
  }

  const parsed = Workspace.Run.Args.test(defaultTestArgs(argv));
  const strategy = parsed.strategy?.kind ?? 'sequential';
  const presentation = resolveTestPresentation(
    strategy,
    input.interactive ?? Cli.Is.interactive(),
  );
  let screenCompletion: t.WorkspaceRun.Test.Reporter.ScreenCompletion | undefined;
  const args = presentation.mode === 'sequential'
    ? parsed
    : presentation.mode === 'parallel-log'
    ? { ...parsed, reporter: presentation.reporter }
    : {
      ...parsed,
      reporter: {
        mode: presentation.reporter,
        onComplete(completion: t.WorkspaceRun.Test.Reporter.ScreenCompletion) {
          screenCompletion = completion;
        },
      },
    };
  clearTestStartupScreen(presentation);
  const result = await Workspace.Run.test(args);
  const output = presentation.mode === 'sequential'
    ? Workspace.Run.Fmt.result(result)
    : Workspace.Run.Fmt.handoff(result, {
      detail: presentation.detail,
      terminal: presentation.terminal,
      ...(screenCompletion ? { screen: screenCompletion } : {}),
    });

  console.info();
  console.info(output);
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
      --parallel=false  run the sequential package test runner
      --jobs=auto       use the bounded automatic worker count
      --jobs=<n>        run at most n package tests at once
      -h, --help        show this help

    Notes:
      deno task test defaults to the topology-safe parallel scheduler.
      deno task test:parallel is the explicit parallel alias.
      deno task test:seq preserves the sequential baseline.
      @sys/workspace flags live after -- and are distinct from Deno task flags.
      For runner DSL guidance: deno run -ER jsr:@sys/workspace dsl test
  `);
}

export function resolveTestPresentation(
  strategy: 'parallel' | 'sequential',
  interactive: boolean,
): TestPresentation {
  if (strategy === 'sequential') return { mode: 'sequential' };
  return interactive
    ? {
      mode: 'parallel-screen',
      reporter: 'screen',
      detail: 'compact',
      terminal: true,
    }
    : {
      mode: 'parallel-log',
      reporter: 'log',
      detail: 'full',
      terminal: false,
    };
}

/** Clear prior stdout before the root-owned workspace setup phase begins. */
export function clearTestStartupScreen(presentation: TestPresentation) {
  if (presentation.mode === 'parallel-screen') Cli.Screen.repaint('');
}

export function defaultTestArgs(argv: readonly string[]) {
  const args = argv.filter((value) => value !== '--');
  return hasParallelFlag(args) ? args : ['--parallel', ...args];
}

function hasParallelFlag(argv: readonly string[]) {
  return argv.some((value) => value === '--parallel' || value.startsWith('--parallel='));
}

if (import.meta.main) await main();
