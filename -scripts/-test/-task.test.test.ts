import { Workspace } from '@sys/workspace';
import { CompletionHang } from '@sys/workspace/run';
import { describe, expect, it } from '@sys/testing/server';
import { Cli, Is, Str, type t } from '../common.ts';
import {
  clearTestStartupScreen,
  defaultTestArgs,
  main,
  resolveTestPresentation,
} from '../task.test.ts';

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
      const repaint = Cli.Screen.repaint;
      Object.defineProperty(Cli.Screen, 'repaint', {
        value: (frame: string) => frames.push(frame),
      });

      try {
        clearTestStartupScreen(resolveTestPresentation('sequential', true));
        clearTestStartupScreen(resolveTestPresentation('parallel', false));
        clearTestStartupScreen(resolveTestPresentation('parallel', true));
      } finally {
        Object.defineProperty(Cli.Screen, 'repaint', { value: repaint });
      }

      expect(frames).to.eql(['']);
    });

    it('clears before the interactive parallel run enters Workspace', async () => {
      const effects: string[] = [];
      const result = {
        ok: true as const,
        task: 'test' as const,
        cwd: '/tmp/workspace',
        elapsed: 1,
        orderedPaths: [],
        packages: [],
      };
      const repaint = Cli.Screen.repaint;
      const run = Workspace.Run.test;
      const armWarning = CompletionHang.armWarning;
      const info = console.info;
      const exitCode = Deno.exitCode;
      Object.defineProperty(Cli.Screen, 'repaint', {
        value: (frame: string) => effects.push(`repaint:${frame.length}`),
      });
      Object.defineProperty(Workspace.Run, 'test', {
        value: () => {
          effects.push('workspace:test');
          return Promise.resolve(result);
        },
      });
      Object.defineProperty(CompletionHang, 'armWarning', {
        value: () => ({ cancel() {} }),
      });
      console.info = () => {};

      try {
        await main({ argv: ['--parallel'], interactive: true });
      } finally {
        Object.defineProperty(Cli.Screen, 'repaint', { value: repaint });
        Object.defineProperty(Workspace.Run, 'test', { value: run });
        Object.defineProperty(CompletionHang, 'armWarning', { value: armWarning });
        console.info = info;
        Deno.exitCode = exitCode;
      }

      expect(effects).to.eql(['repaint:0', 'workspace:test']);
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
      const repaint = Cli.Screen.repaint;
      const size = Cli.Screen.size;
      const run = Workspace.Run.test;
      const armWarning = CompletionHang.armWarning;
      const info = console.info;
      const exitCode = Deno.exitCode;
      Object.defineProperty(Cli.Screen, 'repaint', { value: () => {} });
      Object.defineProperty(Cli.Screen, 'size', { value: () => ({ width: 80, height: 24 }) });
      Object.defineProperty(Workspace.Run, 'test', {
        value: (args?: t.WorkspaceRun.Test.Args) => {
          const reporter = args?.reporter;
          if (reporter && !Is.string(reporter)) {
            reporter.onComplete({ failedPackages: { visible: 2, total: 2 } });
          }
          return Promise.resolve(result);
        },
      });
      Object.defineProperty(CompletionHang, 'armWarning', {
        value: () => ({ cancel() {} }),
      });
      console.info = (...args: unknown[]) => lines.push(String(args[0] ?? ''));

      try {
        await main({ argv: ['--parallel'], interactive: true });
      } finally {
        Object.defineProperty(Cli.Screen, 'repaint', { value: repaint });
        Object.defineProperty(Cli.Screen, 'size', { value: size });
        Object.defineProperty(Workspace.Run, 'test', { value: run });
        Object.defineProperty(CompletionHang, 'armWarning', { value: armWarning });
        console.info = info;
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
        deno task test:parallel is the explicit parallel alias.
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
  const info = console.info;
  console.info = (...args: unknown[]) => lines.push(String(args[0] ?? ''));
  try {
    await main({ argv, interactive: false });
  } finally {
    console.info = info;
  }
  return lines.join('\n');
}
