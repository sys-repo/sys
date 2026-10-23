import { Workspace } from '@sys/workspace';
import { describe, expect, it } from '@sys/testing/server';
import { Cli, Is, Str, type t } from '../common.ts';
import {
  clearTestStartupScreen,
  defaultTestArgs,
  main,
  resolveTestPresentation,
} from '../task.test.ts';
import { wantsTestHelp } from '../u.test.help.ts';

describe('scripts/task.test', () => {
  describe('argument policy', () => {
    it('defaults root test args to the parallel runner', () => {
      expect(defaultTestArgs([])).to.eql(['--parallel']);
      expect(defaultTestArgs(['--jobs=8'])).to.eql(['--parallel', '--jobs=8']);
      expect(defaultTestArgs(['--', '--jobs=auto'])).to.eql(['--parallel', '--jobs=auto']);
      expect(defaultTestArgs(['--parallel', '--', '--jobs=8'])).to.eql([
        '--parallel',
        '--jobs=8',
      ]);
    });

    it('preserves explicit parallel strategy args', () => {
      expect(defaultTestArgs(['--parallel=false'])).to.eql(['--parallel=false']);
      expect(defaultTestArgs(['--parallel', '--jobs=4'])).to.eql(['--parallel', '--jobs=4']);
    });
  });

  describe('presentation ownership', () => {
    it('resolves the complete root presentation policy', () => {
      expect(resolveTestPresentation('sequential', true)).to.eql({ mode: 'sequential' });
      expect(resolveTestPresentation('sequential', false)).to.eql({ mode: 'sequential' });
      expect(resolveTestPresentation('parallel', true)).to.eql({
        mode: 'parallel-screen',
        reporter: 'screen',
        detail: 'compact',
        terminal: true,
      });
      expect(resolveTestPresentation('parallel', false)).to.eql({
        mode: 'parallel-log',
        reporter: 'log',
        detail: 'full',
        terminal: false,
      });
    });

    it('clears the startup viewport only for the interactive parallel screen', () => {
      const frames: string[] = [];
      const repaint = (frame: string) => frames.push(frame);
      clearTestStartupScreen(resolveTestPresentation('sequential', true), repaint);
      clearTestStartupScreen(resolveTestPresentation('parallel', false), repaint);
      clearTestStartupScreen(resolveTestPresentation('parallel', true), repaint);
      expect(frames).to.eql(['']);
    });

    it('clears before the interactive parallel run enters Workspace', async () => {
      const effects: string[] = [];
      const result: t.WorkspaceRun.Ok = {
        ok: true,
        task: 'test',
        cwd: '/tmp/workspace',
        elapsed: 1,
        orderedPaths: [],
        packages: [],
      };
      const exitCode = Deno.exitCode;
      try {
        await main({
          argv: ['--parallel'],
          interactive: true,
          deps: {
            repaint: (frame) => effects.push(`repaint:${frame.length}`),
            async run() {
              effects.push('workspace:test');
              return result;
            },
            armWarning(input) {
              expect(input.result).to.equal(result);
              expect(input.strategy).to.eql({ kind: 'parallel' });
              effects.push('completion:warning');
              return { cancel() {} };
            },
            write: () => {},
          },
        });
        expect(Deno.exitCode).to.eql(0);
      } finally {
        Deno.exitCode = exitCode;
      }
      expect(effects).to.eql(['repaint:0', 'workspace:test', 'completion:warning']);
    });

    it('uses final scrollback truth to avoid repeating visible failure actions', async () => {
      const first = failedPackage('code/pkg-first', 1);
      const second = failedPackage('code/pkg-second', 2);
      const result: t.WorkspaceRun.Fail = {
        ok: false,
        task: 'test',
        cwd: '/tmp/workspace',
        elapsed: 20,
        orderedPaths: [first.path, second.path],
        packages: [first, second],
        failure: first,
      };
      const lines: string[] = [];
      const exitCode = Deno.exitCode;
      try {
        await main({
          argv: ['--parallel'],
          interactive: true,
          deps: {
            repaint: () => {},
            async run(args) {
              const reporter = args?.reporter;
              if (reporter && !Is.string(reporter)) {
                reporter.onComplete({ failedPackages: { visible: 2, total: 2 } });
              }
              return result;
            },
            handoff(result, options) {
              return Workspace.Run.Fmt.handoff(result, { ...options, width: 80 });
            },
            armWarning: () => ({ cancel() {} }),
            write: (...args) => lines.push(String(args[0] ?? '')),
          },
        });
        expect(Deno.exitCode).to.eql(1);
      } finally {
        Deno.exitCode = exitCode;
      }

      const text = Str.trimEdgeNewlines(Cli.stripAnsi(lines.join('\n')));
      expect(text).to.eql(Str.dedent(`
        Workspace tests failed in 20ms
        ${'━'.repeat(80)}
        2 ran · 2 failed
      `));
    });
  });

  describe('operator help', () => {
    it('shares help parsing across test entrypoints without treating other flags as help', () => {
      expect(wantsTestHelp([])).to.eql(false);
      expect(wantsTestHelp(['--jobs=4'])).to.eql(false);
      expect(wantsTestHelp(['--help=false'])).to.eql(false);
      expect(wantsTestHelp(['--', '--help'])).to.eql(true);
      expect(wantsTestHelp(['-h'])).to.eql(true);
      expect(wantsTestHelp(['--help=false', '--help'])).to.eql(true);
    });

    it('renders exact root-local help for both help aliases', async () => {
      const expected = Str.dedent(`
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
        deno task test runs workspace info after successful tests, but not help.
        deno task test:parallel runs parallel tests without workspace info.
        deno task test:seq preserves the sequential baseline.
        @sys/workspace flags live after -- and are distinct from Deno task flags.
        For runner DSL guidance: deno run -ER jsr:@sys/workspace dsl test
    `);

      expect(await runHelp(['--help'])).to.eql(expected);
      expect(await runHelp(['-h'])).to.eql(expected);
    });
  });
});

function failedPackage(path: t.StringPath, code: number): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    name: `@test/${path.split('/').at(-1)}`,
    path,
    code,
    success: false,
    signal: null,
    elapsed: 1,
  };
}

async function runHelp(argv: readonly string[]) {
  const lines: string[] = [];
  await main({
    argv,
    interactive: false,
    deps: {
      write: (...args) => lines.push(String(args[0] ?? '')),
      async run() {
        throw new Error('Help must not run workspace tests');
      },
      armWarning() {
        throw new Error('Help must not arm a completion warning');
      },
    },
  });
  return lines.join('\n');
}
