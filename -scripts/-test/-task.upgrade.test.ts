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
import { PATH, syncPiAgentImport } from '../../code/sys.driver/driver-pi/-scripts/-prep.u.ts';
import { PI_AGENT_IMPORT_BASE } from '../../code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts';
import { Cli, Fs, Is, Str, type t } from '../common.ts';
import { main } from '../task.upgrade.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../..');
const path = PATH.fromRoot(root);
const success: t.Process.InheritOutput = { success: true, code: 0, signal: null };

describe('scripts/task.upgrade', () => {
  let commands: string[];
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
    commands = [];
    info = console.info;
    console.info = (...args: unknown[]) => {
      // Observe actionable commands, not prose, layout, or console-call boundaries.
      const text = Cli.stripAnsi(args.map(String).join(' '));
      commands.push(...text.match(/\bdeno task [\w:-]+/g) ?? []);
    };
  });
  afterEach(() => {
    console.info = info;
  });

  it('canonical apply → refresh newly written metadata → install from the repository root', async () => {
    const fixture = (await Fs.makeTempDir({ prefix: 'upgrade.pi.' })).absolute;
    const target = PATH.fromRoot(fixture);
    const calls: string[] = [];
    try {
      const source = await Fs.readText(path.resolvePkgFile);
      if (!source.ok || !Is.string(source.data)) throw new Error('Missing resolver fixture');
      await Fs.write(target.resolvePkgFile, source.data, { throw: true });
      const actual = await main(['--non-interactive'], {
        async run(input) {
          expect(input.argv).to.eql(['upgrade', '--non-interactive']);
          await Fs.write(
            target.rootDepsYaml,
            Str.dedent(`
              deno.json:
                - import: ${PI_AGENT_IMPORT_BASE}@123.456.789
            `),
            { throw: true },
          );
          calls.push('applied');
          const result = await completeApply(input);
          calls.push('handoff');
          return result;
        },
        async refresh(input) {
          expect(input).to.eql(root);
          expect(calls).to.eql(['applied']);
          const result = await syncPiAgentImport(target);
          expect(result.specifier).to.eql(`${PI_AGENT_IMPORT_BASE}@123.456.789`);
          calls.push('refreshed');
        },
        invoke(input) {
          expect(input).to.eql({ cmd: Deno.execPath(), args: ['install'], cwd: root });
          expect(calls).to.eql(['applied', 'refreshed']);
          calls.push('installed');
          return Promise.resolve(success);
        },
      });
      expect(actual).to.eql({ kind: 'apply', options: { deps: Fs.join(root, 'deps.yaml') } });
      expect(calls).to.eql(['applied', 'refreshed', 'installed', 'handoff']);
      expect((await Fs.readText(target.resolvePkgFile)).data).to.include(
        "const PI_AGENT_IMPORT_VERSION = '123.456.789' as const;",
      );
    } finally {
      await Fs.remove(fixture);
    }
  });

  it('non-apply result or non-root manifest → no refresh or install', async () => {
    for (const kind of ['help', 'plan', 'bump'] as const) {
      await main([], {
        run: () => Promise.resolve({ kind }),
        refresh: () => {
          throw new Error('Unexpected metadata mutation');
        },
        invoke: unexpectedInstall,
      });
    }
    await main([], {
      run: (input) => completeApply(input, Fs.join(root, 'other-deps.yaml')),
      refresh: () => {
        throw new Error('Unexpected metadata mutation');
      },
      invoke: unexpectedInstall,
    });
    expect(commands).to.eql([]);
  });

  it('upgrade rejection → no refresh; refresh rejection → task rejects with the original error', async () => {
    const failure = new Error('controlled failure');
    const failedUpgrade = await expectError(() =>
      main([], {
        run: () => Promise.reject(failure),
        refresh: () => {
          throw new Error('Unexpected metadata mutation');
        },
        invoke: unexpectedInstall,
      })
    );
    expect(failedUpgrade).to.equal(failure);

    const failedRefresh = await expectError(() =>
      main([], {
        run: (input) => completeApply(input),
        refresh: () => Promise.reject(failure),
        invoke: unexpectedInstall,
      })
    );
    expect(failedRefresh).to.equal(failure);
    expect(commands).to.eql([]);
  });

  it('pending install → no guidance; successful install → each next-step command once', async () => {
    const started = Promise.withResolvers<void>();
    const install = Promise.withResolvers<t.Process.InheritOutput>();
    let completed = false;
    const pending = main([], {
      run: (input) => completeApply(input),
      refresh: () => Promise.resolve(),
      invoke() {
        started.resolve();
        return install.promise;
      },
    }).then(() => {
      completed = true;
    });

    try {
      await Promise.race([started.promise, pending]);
      expect(completed).to.eql(false);
      expect(commands).to.eql([]);
    } finally {
      install.resolve(success);
      await pending;
    }
    expect(completed).to.eql(true);
    expect(commands.sort()).to.eql(['deno task bump', 'deno task prep']);
  });

  it('unsuccessful install → upgrade rejects with the exit status and retained-write warning', async () => {
    const error = await expectError(() =>
      main([], {
        run: (input) => completeApply(input),
        refresh: () => Promise.resolve(),
        invoke: () => Promise.resolve({ success: false, code: 17, signal: null }),
      })
    );
    expect(error.message).to.include('deno install failed (exit 17)');
    expect(error.message).to.include('dependency changes are retained');
    expect(commands).to.eql([]);
  });

  it('install spawn rejection → propagate the original error', async () => {
    const failure = new Error('controlled spawn failure');
    const error = await expectError(() =>
      main([], {
        run: (input) => completeApply(input),
        refresh: () => Promise.resolve(),
        invoke: () => Promise.reject(failure),
      })
    );
    expect(error).to.equal(failure);
    expect(commands).to.eql([]);
  });
});

function unexpectedInstall(): Promise<t.Process.InheritOutput> {
  throw new Error('Unexpected dependency installation');
}
