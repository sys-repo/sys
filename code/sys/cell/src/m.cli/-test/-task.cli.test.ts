import { Process } from '@sys/process/process';
import { describe, expect, Fs, it, Path, Str, Testing } from '../../-test.ts';
import { CellSession } from '../u/u.session.ts';
import { main } from '../../../-scripts/task.cli.ts';

describe('@sys/cell development CLI launcher', () => {
  it('known Vite dev start → trusted runner with unchanged arguments and exit status', async () => {
    const sample = './-sample/cell.vite';
    const cases = [
      { input: ['start', '--mode', 'dev'], output: ['start', '--mode', 'dev', sample] },
      { input: ['start', '--mode=dev'], output: ['start', '--mode=dev', sample] },
      {
        input: ['--', 'start', '--mode', 'dev', '--reporter', 'raw'],
        output: ['start', '--mode', 'dev', '--reporter', 'raw', sample],
      },
      { input: ['start', sample, '--mode', 'dev'], output: ['start', sample, '--mode', 'dev'] },
      {
        input: ['start', Path.resolve(sample), '--mode=dev'],
        output: ['start', Path.resolve(sample), '--mode=dev'],
      },
    ];
    for (const item of cases) {
      const calls: unknown[] = [];
      const code = await main(item.input, {
        runCli: async (argv) => {
          calls.push(['restricted', argv]);
          return 9;
        },
        runVite: async (argv) => {
          calls.push(['trusted', argv]);
          return 37;
        },
      });
      expect(calls).to.eql([['trusted', item.output]]);
      expect(code).to.eql(37);
    }
  });

  it('non-Vite, help and invalid requests → restricted runner only', async () => {
    const cases = [
      [],
      ['info'],
      ['kill', '--mode', 'dev'],
      ['start'],
      ['start', '--mode', 'dev', './-sample/cell.stripe'],
      ['start', '--mode', 'dev', './another cell'],
      ['start', './-sample/cell.vite'],
      ['start', '--mode', 'dev', '--help'],
      ['start', '--mode=dev', '-h'],
      ['start', '--mode', 'dev', '--mode', 'prod'],
      ['start', '--mode', 'dev', '--unknown'],
      ['start', '--mode', 'dev', '--dry-run'],
      ['start', '--mode', 'dev', '--reporter', 'invalid'],
      ['start', '--mode', 'dev', './-sample/cell.vite', 'extra'],
    ];
    for (const args of cases) {
      const calls: string[] = [];
      const code = await main(args, {
        runCli: async () => {
          calls.push('restricted');
          return 19;
        },
        runVite: async () => {
          calls.push('trusted');
          return 37;
        },
      });
      expect(calls, args.join(' ')).to.eql(['restricted']);
      expect(code).to.eql(19);
    }
  });

  it('restricted commands → retain sample defaults and explicit argument boundaries', async () => {
    const cases = [
      { input: ['info'], output: ['info', './-sample/cell.stripe'] },
      { input: ['start'], output: ['start', './-sample/cell.stripe'] },
      {
        input: ['kill', '--mode', 'dev'],
        output: ['kill', '--mode', 'dev', './-sample/cell.vite'],
      },
      { input: ['migrate'], output: ['migrate', './-sample/cell.stripe', '--dry-run'] },
      { input: ['init'], output: ['init', './-sample/foo', '--dry-run'] },
      { input: ['task'], output: ['task', 'sample:deploy', './-sample/cell.deploy', '--plan'] },
      {
        input: ['task', 'sample:deploy'],
        output: ['task', 'sample:deploy', './-sample/cell.deploy'],
      },
      { input: ['info', './another cell'], output: ['info', './another cell'] },
      { input: ['start', '--help'], output: ['start', '--help'] },
    ];
    for (const item of cases) {
      const calls: unknown[] = [];
      await main(item.input, {
        runCli: async (argv) => {
          calls.push(argv);
          return 0;
        },
      });
      expect(calls).to.eql([item.output]);
    }
  });

  it('custom dev service → actual CLI retains its restricted permission preset', async () => {
    const fs = await Testing.dir('CellCli.launcher.restricted');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
      kind: cell
      version: 1
      services:
        - name: probe
          use: Probe
          from: ./probe.ts
          config: ./-config/probe.json
          variants:
            dev:
              use: Probe
              from: ./probe.ts
              config: ./-config/probe.json
    `),
      { throw: true },
    );
    await Fs.writeJson(Fs.join(fs.dir, '-config/probe.json'), {}, { throw: true });
    await Fs.write(
      Fs.join(fs.dir, 'probe.ts'),
      Str.dedent(`
      export const Probe = {
        async start() {
          const status = await Deno.permissions.query({ name: 'sys', kind: 'systemMemoryInfo' });
          console.info('CLI_PERMISSION:' + status.state);
          return { finished: Promise.resolve(), close() {} };
        },
      };
    `),
      { throw: true },
    );
    const res = await Process.capture({
      cmd: Deno.execPath(),
      args: [
        'run',
        '-P=cli',
        './-scripts/task.cli.ts',
        'start',
        fs.dir,
        '--mode',
        'dev',
        '--reporter',
        'raw',
      ],
      cwd: Deno.cwd(),
      env: { [CellSession.D.env]: Fs.join(fs.dir, 'runtime') },
      executionTimeout: 30_000,
      maxStdoutBytes: 200_000,
      maxStderrBytes: 200_000,
      terminationGrace: 5_000,
    });
    expect(res.outcome).to.eql('exited');
    if (res.outcome !== 'exited') throw new Error(`CLI did not exit: ${res.outcome}`);
    expect(res.code, `${res.text.stdout}\n${res.text.stderr}`).to.eql(0);
    expect(res.text.stdout).to.contain('CLI_PERMISSION:prompt');
  });
});
