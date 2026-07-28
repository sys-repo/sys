import { describe, expect, it } from '@sys/testing/server';
import { Str } from '../common.ts';
import { defaultTestArgs, hasParallelFlag, main, resolveTestPresentation } from '../task.test.ts';

describe('scripts/task.test', () => {
  it('exports a main entrypoint', () => {
    expect(typeof main).to.equal('function');
  });

  it('defaults root test args to the parallel runner', () => {
    expect(defaultTestArgs([])).to.eql(['--parallel']);
    expect(defaultTestArgs(['--jobs=8'])).to.eql(['--parallel', '--jobs=8']);
    expect(defaultTestArgs(['--', '--jobs=auto'])).to.eql(['--parallel', '--jobs=auto']);
    expect(defaultTestArgs(['--parallel', '--', '--jobs=8'])).to.eql(['--parallel', '--jobs=8']);
  });

  it('preserves explicit parallel strategy args', () => {
    expect(defaultTestArgs(['--parallel=false'])).to.eql(['--parallel=false']);
    expect(defaultTestArgs(['--parallel', '--jobs=4'])).to.eql(['--parallel', '--jobs=4']);
    expect(hasParallelFlag(['--parallel=false'])).to.eql(true);
  });

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
