import { create, start } from '@sys/http/server/host';
import { describe, expect, Fs, Is, it, Str, type t, Testing } from '../../src/-test.ts';
import { Cli, Process, stripAnsi } from '../../src/m.cli/common.ts';
import { CellCli } from '../../src/m.cli/mod.ts';
import { withRuntimeDir } from '../../src/m.cli/-test/u.fixture.kill.ts';
import { main } from '../task.sample.ts';

type Kill = t.CellCli.Kill.Result;
type Dependencies = NonNullable<Parameters<typeof main>[1]>;

const targets = [
  ['sample:stripe', './-sample/cell.stripe', 'default'],
  ['sample:deploy:start', './-sample/cell.deploy', 'default'],
  ['sample:vite', './-sample/cell.vite', 'default'],
] as const;

const stripe = ['kill', './-sample/cell.stripe', '--mode', 'default'];
const preview = [...stripe, '--dry-run'];

function unexpected(): never {
  throw new Error('Unexpected sample interaction');
}

const deps: Dependencies = {
  menu: unexpected,
  interactive: () => true,
  select: () => Promise.resolve('sample:stripe'),
  confirm: unexpected,
  runCli: unexpected,
};

describe('@sys/cell sample menu', () => {
  it('ordinary argv → delegates without changing argv or child status', async () => {
    const cases = [
      ['sample:stripe'],
      ['--', '--non-interactive', 'sample:deploy'],
      ['--help'],
      ['-h'],
      ['--list'],
      ['-l'],
      ['kill', '--help'],
      ['kill', '--force'],
      ['kill', 'extra'],
      ['--', '--', 'kill'],
    ];
    for (const argv of cases) {
      const code = await main(argv, {
        ...deps,
        interactive: unexpected,
        select: unexpected,
        menu: (options) => {
          expect(options).to.eql({ cwd: '.', argv, title: '@sys/cell', include: ['sample:*'] });
          return Promise.resolve({
            kind: 'selected',
            task: { name: 'sample:stripe', command: 'sample start' },
            run: { name: 'sample:stripe', output: { code: 17, success: false, signal: null } },
          });
        },
      });
      expect(code, argv.join(' ')).to.eql(17);
    }
  });

  it('bare sample → shows the green START header before the task picker', async () => {
    const output: string[] = [];
    const info = console.info;
    try {
      console.info = (text: string) => output.push(text);
      const code = await main([], {
        ...deps,
        menu: (options) => {
          const title = 'START · @sys/cell samples';
          expect(output).to.eql([Cli.Fmt.Header.rows({ title, tone: 'green' }).join('\n')]);
          expect(options).to.eql({
            cwd: '.',
            argv: [],
            title: 'Choose a sample task',
            include: ['sample:*'],
          });
          return Promise.resolve({ kind: 'exit' });
        },
      });
      expect(code).to.eql(0);
    } finally {
      console.info = info;
    }
  });

  it('kill → refuses before any prompt or CLI call without an interactive terminal', async () => {
    const events: string[] = [];
    const noPrompt: Dependencies = {
      ...deps,
      select: () => {
        events.push('select');
        return Promise.resolve('sample:stripe');
      },
      runCli: () => {
        events.push('CLI');
        return Promise.resolve(killResult());
      },
    };
    expect(await main(['kill'], { ...noPrompt, interactive: () => false })).to.eql(1);
    const cases = [['kill', '--non-interactive'], ['--', '--non-interactive', 'kill']];
    for (const argv of cases) {
      expect(await main(argv, { ...noPrompt, interactive: () => true })).to.eql(1);
    }
    expect(events).to.eql([]);
  });

  it('piped sample kill → publishes a nonzero exit status at the task entrypoint', async () => {
    const result = await Process.capture({
      cmd: Deno.execPath(),
      args: ['task', 'sample', 'kill'],
      executionTimeout: 10_000,
      maxStdoutBytes: 32_000,
      maxStderrBytes: 32_000,
    });
    expect(result.code).to.eql(1);
    expect(result.text.stderr).to.include('Sample cleanup requires an interactive terminal.');
  });

  it('each service start → preview, default-No confirmation, then the same root and mode', async () => {
    for (const [name, root, mode] of targets) {
      const events: unknown[] = [];
      const liveStatus = 1;
      const dryRun = killResult({
        sessions: [session('would-terminate')],
        resources: [resource('skipped')],
      });
      const live = killResult({ dryRun: false, code: liveStatus });
      const code = await main(['--', 'kill'], {
        ...deps,
        select: ({ options }) => {
          expect(options).to.eql([
            ...targets.map(([name]) => ({ name, value: name })),
            '(exit)',
          ]);
          events.push('selected');
          return Promise.resolve(name);
        },
        runCli: (input) => {
          const argv = input?.argv ?? [];
          events.push(argv);
          return Promise.resolve(argv.includes('--dry-run') ? dryRun : live);
        },
        confirm: (input) => {
          expectConfirmation(input, root, mode);
          events.push('confirmed');
          return Promise.resolve(true);
        },
      });
      expect(events).to.eql([
        'selected',
        ['kill', root, '--mode', mode, '--dry-run'],
        'confirmed',
        ['kill', root, '--mode', mode],
      ]);
      expect(code).to.eql(liveStatus);
    }
  });

  it('exit, No, or prompt failure → never dispatches live cleanup', async () => {
    let previews = 0;
    const exit = await main(['kill'], { ...deps, select: () => Promise.resolve('(exit)') });
    expect(exit).to.eql(0);
    const cases = [
      [() => Promise.resolve(false), 0],
      [() => Promise.reject(new Error('Confirmation interrupted')), 1],
    ] as const;
    for (const [confirm, expected] of cases) {
      const code = await main(['kill'], {
        ...deps,
        runCli: (input) => {
          expect(input?.argv).to.eql(preview);
          previews++;
          return Promise.resolve(killResult({ resources: [resource('would-terminate')] }));
        },
        confirm,
      });
      expect(code).to.eql(expected);
    }
    expect(previews).to.eql(2);
  });

  it('only a successful, actionable dry run can reach confirmation', async () => {
    const cases: readonly [t.CellCli.Result, number][] = [
      [killResult(), 0],
      [killResult({ sessions: [session('would-remove-stale')] }), 0],
      [killResult({ sessions: [session('stale-running')], resources: [resource('skipped')] }), 0],
      [killResult({ resources: [resource('not-listening')] }), 0],
      [{ kind: 'error', code: 21, text: 'Preview failed', input: {} }, 21],
      [killResult({ code: 22, sessions: [session('would-terminate')] }), 22],
      [killResult({ dryRun: false, sessions: [session('would-terminate')] }), 1],
      [{ kind: 'help', input: {}, text: 'Unexpected help' }, 1],
    ];
    for (const [result, expected] of cases) {
      const events: string[] = [];
      const code = await main(['kill'], {
        ...deps,
        runCli: (input) => {
          expect(input?.argv).to.eql(preview);
          events.push('preview');
          return Promise.resolve(result);
        },
        confirm: () => {
          events.push('confirm');
          return Promise.resolve(false);
        },
      });
      expect(events).to.eql(['preview']);
      expect(code).to.eql(expected);
    }
  });

  it('real dry run → reports a test-owned listener once before No leaves it serving', () =>
    Testing.withTmpDir(async (cwd) => {
      const hostname = '127.0.0.1';
      const app = create().get('/', (ctx) => ctx.text('test occupant'));
      await using server = start(app, { hostname, port: 0, strictPort: true, silent: true });
      const root = Fs.join(cwd, stripe[1]);
      await writeStaticSample(root, hostname, server.port);

      await withRuntimeDir(Fs.join(cwd, 'runtime'), async () => {
        const reports: string[] = [];
        const info = console.info;
        let confirmed = false;
        let calls = 0;
        try {
          console.info = (text: string) => reports.push(text);
          const code = await main(['kill'], {
            ...deps,
            select: () => {
              const title = 'KILL · @sys/cell samples';
              expect(reports).to.eql([Cli.Fmt.Header.rows({ title, tone: 'yellow' }).join('\n')]);
              return Promise.resolve('sample:stripe');
            },
            runCli: (input) => {
              calls++;
              expect(input?.argv).to.eql(preview);
              // Rebase only the test's root. Never send a live kill to the real CLI.
              return CellCli.run({ argv: ['kill', root, ...preview.slice(2)] });
            },
            confirm: (input) => {
              confirmed = true;
              expectConfirmation(input, stripe[1], 'default');
              expect(reports).to.have.length(2); // Picker header, then one Cell report.
              const report = stripAnsi(reports[1]);
              expect(report).to.include(`tcp ${hostname}:${server.port}`);
              expect(report).to.include('would-terminate');
              expect(report).to.match(new RegExp(`listeners\\s+${Deno.pid}\\b`));
              return Promise.resolve(false);
            },
          });
          expect(code, reports.join('\n')).to.eql(0);
          expect(confirmed).to.eql(true);
          expect(calls).to.eql(1);
        } finally {
          console.info = info;
        }
      });

      const response = await fetch(`http://${hostname}:${server.port}/`, {
        redirect: 'error',
        signal: AbortSignal.timeout(2_000),
      });
      expect(await response.text()).to.eql('test occupant');
    }));
});

/**
 * Helpers:
 */
function killResult(overrides: Partial<Kill> = {}): Kill {
  return {
    kind: 'kill',
    input: {},
    text: 'Cell kill report',
    root: stripe[1],
    mode: 'default',
    dryRun: true,
    force: false,
    code: 0,
    sessions: [],
    resources: [],
    ...overrides,
  };
}

function session(status: t.CellCli.Kill.SessionStatus): t.CellCli.Kill.SessionResult {
  return {
    id: 'session',
    mode: 'default',
    pid: 123,
    state: 'ready',
    status,
    fresh: status !== 'stale-running' && status !== 'would-remove-stale',
    updatedAt: 0,
  };
}

function resource(status: t.CellCli.Kill.ResourceStatus): t.CellCli.Kill.ResourceResult {
  return { service: 'view', kind: 'tcp-listener', port: 4040, status, listeners: [] };
}

function expectConfirmation(
  input: Parameters<NonNullable<Dependencies['confirm']>>[0],
  root: string,
  mode: string,
) {
  if (!input || Is.string(input)) throw new Error('Expected confirmation options.');
  expect(input.default).to.eql(false);
  expect(input.message).to.eql(Str.dedent(`
    Cleanup for ${root} (mode: ${mode})
    Cell will scan again. It may remove dead session records and stop recorded
    supervisors and processes it finds listening at declared addresses.
    Those processes may be unrelated or different from the preview.
    SIGTERM can escalate to SIGKILL.
    Run this cleanup?
  `));
}

async function writeStaticSample(root: string, hostname: string, port: number) {
  const descriptor = Str.dedent(`
    kind: cell
    version: 1
    services:
      - name: view
        use: HttpStatic
        from: 'jsr:@sys/http/server/static'
        config: ./-config/@sys.http/static.view.yaml
  `);
  const config = Str.dedent(`
    name: view
    dir: ./view
    hostname: ${hostname}
    port: ${port}
    strictPort: true
  `);
  await Fs.write(Fs.join(root, '-config/@sys.cell/cell.yaml'), descriptor, { throw: true });
  await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), config, { throw: true });
}
