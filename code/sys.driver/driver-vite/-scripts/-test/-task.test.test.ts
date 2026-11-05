import { Process } from '@sys/process/process';
import { describe, Err, expect, Fs, it, ROOT } from '../../src/-test.ts';
import { commands, proofs, run } from '../task.test.ts';

const cwd = ROOT.resolve('code/sys.driver/driver-vite');
const fixture = Fs.join(cwd, '-scripts/-test/u.fixture.task.argv.ts');

/** Pin Deno task-shell forwarding before replacing the existing shell chains. */
describe('Vite task shell compatibility', () => {
  it('aliases and chains → preserve argv boundaries and final-command forwarding', async () => {
    const dir = await Fs.makeTempDir({ prefix: 'vite-task-argv-' });
    try {
      await Fs.write(
        Fs.join(dir.absolute, 'deno.json'),
        JSON.stringify({
          tasks: {
            run: `deno run --cached-only --frozen --no-prompt "${fixture}"`,
            lane: 'deno task run --trace-leaks ./src/example.test.ts',
            proofs: 'deno task lane && deno task lane',
          },
        }),
      );
      const tail = ['--filter=two words', './a path/test.ts', '--', 'literal $HOME', 'a;b'];
      for (const task of ['lane', 'proofs']) {
        const result = await Process.capture({
          cwd: dir.absolute,
          args: ['task', task, ...tail],
          env: { FORCE_COLOR: '0' },
          executionTimeout: 15_000,
          maxStdoutBytes: 16_384,
          maxStderrBytes: 16_384,
        });
        expect(result.outcome, result.toString()).to.eql('exited');
        if (result.outcome !== 'exited') throw new Error(result.toString());
        expect(result.code, result.toString()).to.eql(0);
        const records = result.text.stdout.trim().split('\n').map((line) => JSON.parse(line));
        const base = ['--trace-leaks', './src/example.test.ts'];
        expect(records.map((record) => record.args)).to.eql(
          task === 'lane' ? [[...base, ...tail]] : [base, [...base, ...tail]],
        );
        expect(result.text.stderr).to.include('task-fixture-stderr');
      }
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});

Deno.test({
  name: 'Vite task executable → propagate native child interruption and inherited output',
  ignore: Deno.build.os === 'windows',
  async fn() {
    const result = await Process.capture({
      cwd,
      args: ['task', 'test:unit', './-scripts/-test/u.fixture.task.interrupt.ts'],
      executionTimeout: 20_000,
      maxStdoutBytes: 16_384,
      maxStderrBytes: 16_384,
    });
    expect(result.outcome, result.toString()).to.eql('exited');
    if (result.outcome !== 'exited') throw new Error(result.toString());
    expect(result.code, result.toString()).to.eql(130);
    expect(result.text.stdout).to.include('task interruption fixture');
    expect(result.text.stderr).to.include('test:run');
  },
});

/** Test the process boundary independently of the permissionless argv fixture. */
describe('Vite task dispatcher', () => {
  it('host environment → inherit everything and preserve explicit color, including empty', async () => {
    for (const color of [undefined, '', '0', '2']) {
      const calls: Parameters<typeof Process.inherit>[0][] = [];
      const code = await run(['dev'], async (args) => {
        calls.push(args);
        return { code: 0, success: true, signal: null };
      }, {
        has: (key) => key === 'FORCE_COLOR' && color !== undefined,
        get: (key) => {
          expect(key).to.eql('FORCE_COLOR');
          return color ?? '';
        },
      });
      expect(code).to.eql(0);
      expect(calls).to.eql([{
        cwd: `${cwd}/`,
        args: commands(['dev'])[0],
        clearEnv: false,
        env: { FORCE_COLOR: color ?? '1' },
      }]);
    }
  });

  it('proofs → await each child and stop at the first exact failure or interruption status', async () => {
    for (const failed of [7, 130, 137]) {
      const calls: string[][] = [];
      let active = false;
      const code = await run(['proofs'], async ({ args }) => {
        expect(active).to.eql(false);
        active = true;
        calls.push(args);
        await Promise.resolve();
        active = false;
        const code = calls.length === 2 ? failed : 0;
        return { code, success: code === 0, signal: null };
      }, { has: () => false, get: () => '' });
      expect(code).to.eql(failed);
      expect(calls).to.eql(commands(['proofs']).slice(0, 2));
    }
  });

  it('successful aggregate → execute every lane once in order', async () => {
    const calls: string[][] = [];
    const code = await run(['proofs'], async ({ args }) => {
      calls.push(args);
      return { code: 0, success: true, signal: null };
    }, { has: () => false, get: () => '' });
    expect(code).to.eql(0);
    expect(calls).to.eql(commands(['proofs']));
    expect(calls).to.have.length(proofs.length);
  });

  it('process rejection → retain identity and launch no later lane', async () => {
    const error = new Error('spawn failed');
    let calls = 0;
    const result = await Err.Try.run(() =>
      run(['proofs'], () => {
        calls += 1;
        throw error;
      }, { has: () => false, get: () => '' })
    );
    expect(result.result.ok).to.eql(false);
    result.catch((cause) => expect(cause).to.equal(error));
    expect(calls).to.eql(1);
  });
});
