import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectError,
  it,
  Testing,
} from '@sys/testing/server';
import { WorkspaceUpgrade } from '@sys/workspace/upgrade';
import { Cli, Fs, type t } from '../common.ts';
import { main } from '../task.upgrade.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../..');
const success: t.Process.InheritOutput = { success: true, code: 0, signal: null };
const markdown = 'code/sys/markdown';
const stringifyTest = './src/m.Markdown/-test/-u.stringify.test.ts';
const phases = [
  { name: 'Lockfile sync', args: ['task', 'lock:sync'], dir: '.' },
  { name: 'Frozen install', args: ['task', 'install'], dir: '.' },
  {
    name: 'Checked Markdown stringify',
    args: ['task', 'test', '--frozen-lockfile', stringifyTest],
    dir: markdown,
  },
];

describe('scripts/task.upgrade', () => {
  let output: string[];
  let info: typeof console.info;
  let applied: Awaited<ReturnType<typeof WorkspaceUpgrade.apply>>;

  beforeAll(async () => {
    applied = await Testing.withTmpDir(async (cwd) => {
      const deps = Fs.join(cwd, 'deps.yaml');
      await Fs.write(deps, 'deno.json: []\n', { throw: true });
      await Fs.writeJson(Fs.join(cwd, 'deno.json'), {}, { throw: true });
      return await WorkspaceUpgrade.apply({ cwd, deps });
    });
  });

  // Simulate the CLI invoking the finalizer after its writes and before it returns.
  async function completeApply(input: t.WorkspaceCli.Input, deps = Fs.join(root, 'deps.yaml')) {
    await input.finalizeUpgrade?.({ ...applied, input: { ...applied.input, deps } });
    return { kind: 'apply', options: { deps } } as const;
  }

  beforeEach(() => {
    output = [];
    info = console.info;
    console.info = (...args: unknown[]) => output.push(Cli.stripAnsi(args.map(String).join(' ')));
  });
  afterEach(() => {
    console.info = info;
  });

  it('hard link to root deps.yaml → refresh and verify before handoff', async () => {
    await Testing.withTmpDir(async (dir) => {
      const manifest = Fs.join(dir, 'deps.yaml');
      const alias = Fs.join(dir, 'other.yaml');
      await Fs.write(manifest, 'deno.json: []\n', { throw: true });
      await Deno.link(manifest, alias);

      const argv = ['--non-interactive', '--deps', alias];
      const calls: (string | t.Process.InvokeArgs)[] = [];
      await main(argv, {
        root: dir,
        async run(input) {
          expect(input.argv).to.eql(['upgrade', ...argv]);
          calls.push('applied');
          const result = await completeApply(input, alias);
          calls.push('handoff');
          return result;
        },
        refresh(root) {
          expect(root).to.eql(dir);
          calls.push('refreshed');
          return Promise.resolve();
        },
        invoke(input) {
          calls.push(input);
          return Promise.resolve(success);
        },
      });
      expect(calls).to.eql([
        'applied',
        'refreshed',
        ...phases.map((p) => ({ cmd: Deno.execPath(), args: p.args, cwd: Fs.join(dir, p.dir) })),
        'handoff',
      ]);
    });
  });

  it('distinct manifest with identical bytes → no root phases', async () => {
    await Testing.withTmpDir(async (dir) => {
      const manifest = Fs.join(dir, 'deps.yaml');
      const copy = Fs.join(dir, 'other.yaml');
      await Fs.write(manifest, 'deno.json: []\n', { throw: true });
      await Deno.copyFile(manifest, copy);
      await main([], {
        root: dir,
        run: (input) => completeApply(input, copy),
        refresh: unexpectedInvocation,
        invoke: unexpectedInvocation,
      });
      expect(output).to.eql([]);
    });
  });

  it('missing applied manifest → reject instead of handing off unchecked', async () => {
    await Testing.withTmpDir(async (dir) => {
      const missing = Fs.join(dir, 'missing.yaml');
      const error = await expectError(() =>
        main([], {
          run: (input) => completeApply(input, missing),
          refresh: unexpectedInvocation,
          invoke: unexpectedInvocation,
        })
      );
      expect(error.message).to.include(missing);
      expect(error.message).to.include('dependency writes are retained');
      expect(error.cause).to.be.instanceOf(Deno.errors.NotFound);
      expect(output).to.eql([]);
    });
  });

  it('dry run → no root phases after the CLI returns', async () => {
    await main(['--dry-run'], {
      run: () => Promise.resolve({ kind: 'plan' }),
      refresh: unexpectedInvocation,
      invoke: unexpectedInvocation,
    });
    expect(output).to.eql([]);
  });

  it('apply or Pi refresh rejection → no verification phases', async () => {
    const failure = new Error('controlled failure');
    const failedUpgrade = await expectError(() =>
      main([], {
        run: () => Promise.reject(failure),
        refresh: unexpectedInvocation,
        invoke: unexpectedInvocation,
      })
    );
    expect(failedUpgrade).to.equal(failure);

    const failedRefresh = await expectError(() =>
      main([], {
        run: (input) => completeApply(input),
        refresh: () => Promise.reject(failure),
        invoke: unexpectedInvocation,
      })
    );
    expect(failedRefresh.cause).to.equal(failure);
    expect(failedRefresh.message).to.include('Pi dependency metadata refresh failed');
    expect(failedRefresh.message).to.include('dependency files');
    expect(failedRefresh.message).to.include('deno task prep:deps');
    expect(failedRefresh.message).to.include('code/sys.driver/driver-pi');
    expect(failedRefresh.message).to.include('without rerunning upgrade');
    expect(output).to.eql([]);
  });

  it('pending consumer → no success handoff; all checks pass → each next-step command once', async () => {
    const started = Promise.withResolvers<void>();
    const consumer = Promise.withResolvers<t.Process.InheritOutput>();
    let completed = false;
    const pending = main([], {
      run: (input) => completeApply(input),
      refresh: () => Promise.resolve(),
      invoke({ args }) {
        if (args[1] !== 'test') return Promise.resolve(success);
        started.resolve();
        return consumer.promise;
      },
    }).then(() => {
      completed = true;
    });

    try {
      await Promise.race([started.promise, pending]);
      expect(completed).to.eql(false);
      expect(output.join('\n')).to.not.include('passed');
      expect(nextSteps()).to.eql([]);
    } finally {
      consumer.resolve(success);
      await pending;
    }
    expect(output.join('\n')).to.include('Frozen install and checked Markdown stringify passed');
    expect(nextSteps().sort()).to.eql(['deno task bump', 'deno task prep']);
  });

  for (const [index, phase] of phases.entries()) {
    it(`${phase.name} fails → report the retry and stop at that phase`, async () => {
      const invoked: t.Process.InvokeArgs['args'][] = [];
      const error = await expectError(() =>
        main([], {
          run: (input) => completeApply(input),
          refresh: () => Promise.resolve(),
          invoke({ args }) {
            invoked.push(args);
            return Promise.resolve(
              invoked.length === index + 1 ? { success: false, code: 17, signal: null } : success,
            );
          },
        })
      );
      expect(invoked).to.eql(phases.slice(0, index + 1).map((p) => p.args));
      expect(error.message).to.include(`${phase.name} failed (exit 17)`);
      expect(error.message).to.include('dependency files and any Pi metadata writes are retained');
      expect(error.message).to.include(
        index === 0 ? 'The lockfile may have changed' : 'The synchronized lockfile is retained',
      );
      expect(error.message).to.include(`deno ${phase.args.join(' ')}`);
      expect(error.message).to.include(phase.dir === '.' ? 'the repository root' : phase.dir);
      expect(error.message).to.include('without rerunning upgrade');
      expect(output.join('\n')).to.not.include('passed');
      expect(nextSteps()).to.eql([]);
    });
  }

  it('child spawn rejection → name the failed phase and preserve the original error', async () => {
    const failure = new Error('controlled spawn failure');
    const error = await expectError(() =>
      main([], {
        run: (input) => completeApply(input),
        refresh: () => Promise.resolve(),
        invoke: () => Promise.reject(failure),
      })
    );
    expect(error.cause).to.equal(failure);
    expect(error.message).to.include('Lockfile sync could not run');
    expect(nextSteps()).to.eql([]);
  });

  function nextSteps() {
    return output.join('\n').match(/\bdeno task (?:prep|bump)(?![\w:-])/g) ?? [];
  }
});

function unexpectedInvocation(): never {
  throw new Error('Unexpected dependency verification command');
}
