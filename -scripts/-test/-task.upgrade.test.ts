import { describe, expect, expectError, it } from '@sys/testing/server';
import { PATH, syncPiAgentImport } from '../../code/sys.driver/driver-pi/-scripts/-prep.u.ts';
import { PI_AGENT_IMPORT_BASE } from '../../code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts';
import { Fs, Is, Str } from '../common.ts';
import { main } from '../task.upgrade.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../..');
const path = PATH.fromRoot(root);

describe('scripts/task.upgrade', () => {
  it('canonical apply → awaits metadata refresh against the newly written dependency', async () => {
    const fixture = (await Fs.makeTempDir({ prefix: 'upgrade.pi.' })).absolute;
    const target = PATH.fromRoot(fixture);
    const calls: string[] = [];
    const applied = { kind: 'apply', options: { deps: Fs.join(root, 'deps.yaml') } } as const;
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
          return applied;
        },
        async refresh(input) {
          expect(input).to.eql(root);
          expect(calls).to.eql(['applied']);
          const result = await syncPiAgentImport(target);
          expect(result.specifier).to.eql(`${PI_AGENT_IMPORT_BASE}@123.456.789`);
          calls.push('refreshed');
        },
      });
      expect(actual).to.equal(applied);
      expect(calls).to.eql(['applied', 'refreshed']);
      expect((await Fs.readText(target.resolvePkgFile)).data).to.include(
        "const PI_AGENT_IMPORT_VERSION = '123.456.789' as const;",
      );
    } finally {
      await Fs.remove(fixture);
    }
  });

  it('help, dry-run, or another manifest → no metadata refresh', async () => {
    for (const kind of ['help', 'plan', 'bump'] as const) {
      await main([], {
        run: () => Promise.resolve({ kind }),
        refresh: () => {
          throw new Error('Unexpected metadata mutation');
        },
      });
    }
    await main([], {
      run: () =>
        Promise.resolve({
          kind: 'apply',
          options: { deps: Fs.join(root, 'other-deps.yaml') },
        }),
      refresh: () => {
        throw new Error('Unexpected metadata mutation');
      },
    });
  });

  it('upgrade rejection → no refresh; refresh rejection → task rejects with the original error', async () => {
    const failure = new Error('controlled failure');
    const failedUpgrade = await expectError(() =>
      main([], {
        run: () => Promise.reject(failure),
        refresh: () => {
          throw new Error('Unexpected metadata mutation');
        },
      })
    );
    expect(failedUpgrade).to.equal(failure);

    const failedRefresh = await expectError(() =>
      main([], {
        run: () =>
          Promise.resolve({ kind: 'apply', options: { deps: Fs.join(root, 'deps.yaml') } }),
        refresh: () => Promise.reject(failure),
      })
    );
    expect(failedRefresh).to.equal(failure);
  });
});
