import { c, Cli, describe, expect, it, Str, type t } from '../../-test.ts';
import { CompletionHang } from '../mod.ts';

const SAMPLE_DELAY = 2_000 as t.Msecs;

describe('WorkspaceRun.CompletionHang', () => {
  it('formats a mild post-completion hang warning from completed run data', () => {
    const text = Cli.stripAnsi(CompletionHang.formatWarning({
      result: result({ ok: true }),
      strategy: { kind: 'parallel', jobs: 3 },
      delay: SAMPLE_DELAY,
      packages: [
        { path: 'sample/pkg-alpha', name: '@sample/alpha' },
        { path: 'sample/pkg-beta', name: '@sample/beta' },
        { path: 'sample/pkg-gamma', name: '@sample/gamma' },
      ],
      contextLimit: 2,
    }));

    expect(text).to.eql(Str.dedent(`
      Warning
      workspace test completed, but the parent process appears to be hanging after 2s

      - all package results completed
      - result: passed
      - packages: 3 completed
      - strategy: parallel, jobs 3
      - note: remaining liveness is outside the completed package results
      - context:
        - @sample/beta - sample/pkg-beta, 12s
        - @sample/alpha - sample/pkg-alpha, 8s
    `));
  });

  it('does not blame packages when package identity context is absent', () => {
    const text = Cli.stripAnsi(CompletionHang.formatWarning({
      result: result({ ok: false }),
      strategy: { kind: 'parallel' },
      delay: SAMPLE_DELAY,
      contextLimit: 1,
    }));

    expect(text.includes('- result: failed')).to.eql(true);
    expect(text.includes('- strategy: parallel')).to.eql(true);
    expect(text.includes('@sample/')).to.eql(false);
    expect(text.includes('  - sample/pkg-beta, 12s')).to.eql(true);
  });

  it('styles the warning header, body line, and detail lines', () => {
    const raw = CompletionHang.formatWarning({
      result: result({ ok: true }),
      strategy: { kind: 'parallel', jobs: 3 },
      delay: SAMPLE_DELAY,
      contextLimit: 0,
    });

    expect(raw.includes(c.yellow('Warning'))).to.eql(true);
    expect(raw.includes(c.gray(c.italic(
      'workspace test completed, but the parent process appears to be hanging after 2s',
    )))).to.eql(true);
    expect(raw.includes(c.gray(c.italic('- all package results completed')))).to.eql(true);
  });

  it('arms an unrefed one-shot warning that can be cancelled', () => {
    const calls: string[] = [];
    let callback = () => {};
    let cleared: number | undefined;
    let unrefed: number | undefined;
    const deps: t.CompletionHang.Deps = {
      setTimeout(fn, delay) {
        callback = fn;
        calls.push(`set:${delay}`);
        return 7;
      },
      clearTimeout(id) {
        cleared = id;
      },
      unrefTimer(id) {
        unrefed = id;
      },
    };

    const armed = CompletionHang.armWarning({
      result: result({ ok: true }),
      delay: SAMPLE_DELAY,
      deps,
      write: (line) => calls.push(line),
    });

    expect(calls).to.eql(['set:2000']);
    expect(unrefed).to.eql(7);

    callback();
    callback();

    expect(calls.length).to.eql(2);
    expect(Cli.stripAnsi(calls[1] ?? '').startsWith('Warning\n')).to.eql(true);

    armed.cancel();
    expect(cleared).to.eql(undefined);
  });

  it('cancels a pending warning before it writes', () => {
    const calls: string[] = [];
    let callback = () => {};
    let cleared: number | undefined;
    let unrefed: number | undefined;
    const deps: t.CompletionHang.Deps = {
      setTimeout(fn) {
        callback = fn;
        return 11;
      },
      clearTimeout(id) {
        cleared = id;
      },
      unrefTimer(id) {
        unrefed = id;
      },
    };

    const armed = CompletionHang.armWarning({
      result: result({ ok: true }),
      delay: SAMPLE_DELAY,
      deps,
      write: (line) => calls.push(line),
    });

    armed.cancel();
    callback();

    expect(unrefed).to.eql(11);
    expect(cleared).to.eql(11);
    expect(calls).to.eql([]);
  });
});

function result(args: { readonly ok: boolean }): t.WorkspaceRun.Result {
  const packages = [
    ran('sample/pkg-alpha', 8_000),
    ran('sample/pkg-beta', 12_000, args.ok),
    { kind: 'skipped' as const, path: 'sample/pkg-gamma', reason: 'task:missing' as const },
  ];
  const base = {
    task: 'test' as const,
    cwd: '/tmp/sample-workspace' as t.StringDir,
    elapsed: 20_000 as t.Msecs,
    orderedPaths: packages.map((item) => item.path),
    packages,
  };
  const failure = packages.find((item): item is t.WorkspaceRun.Package.Ran => {
    return item.kind === 'ran' && !item.success;
  });

  return args.ok || !failure
    ? { ...base, ok: true as const }
    : { ...base, ok: false as const, failure };
}

function ran(path: string, elapsed: number, success = true): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed,
  };
}
