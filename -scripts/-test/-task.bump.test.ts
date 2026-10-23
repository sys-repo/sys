import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { Cli } from '@sys/cli';
import { type t } from '@sys/workspace';
import { Fixture } from '../../code/sys/workspace/src/m.delta/-test/u.fixture.ts';
import { fromRefWith } from '../../code/sys/workspace/src/m.delta/m.Git/u.fromRef.ts';
import { runWith } from '../../code/sys/workspace/src/m.cli/m.run.ts';
import { main, mainWith } from '../task.bump.ts';
import {
  bumpPolicy,
  postBumpLockSyncArgs,
  postBumpPackageSyncArgs,
  postBumpPrepArgs,
} from '../task.bump.policy.ts';

describe('scripts/task.bump', {
  permissions: { read: true, write: true, env: true, run: false },
}, () => {
  it('syncs metadata, runs bump prep, then reconciles the lockfile', () => {
    expect(postBumpPackageSyncArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-pkg',
    ]);
    expect(postBumpPrepArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-bump',
      '--prep-context=bump',
    ]);
    expect(postBumpLockSyncArgs()).to.eql(['task', 'lock:sync']);

    const followups = bumpPolicy().followups?.({ cwd: '/workspace', plan: emptyPlan() }) ?? [];
    expect(followups.map((item) => item.label)).to.eql([
      'post-bump package metadata sync',
      'post-bump prep',
      'post-bump lockfile sync',
    ]);
    expect(followups.map((item) => [item.cmd, item.args])).to.eql([
      ['deno', [...postBumpPackageSyncArgs()]],
      ['deno', [...postBumpPrepArgs()]],
      ['deno', [...postBumpLockSyncArgs()]],
    ]);
  });

  it('renders bump help with release, since, and from options', async () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      await main({ argv: ['--help'] });
    } finally {
      console.info = info;
    }

    const output = calls.join('\n');
    expect(output).to.include('@sys/workspace bump');
    expect(output).to.include('--release <patch|minor|major>');
    expect(output).to.include('--since <git-ref>');
    expect(output).to.include('--from <pkg|path>');
    expectMaxVisibleWidth(output, 80);
  });

  it('forwards bump inputs and derives dry-run roots from a since ref', async () => {
    await Testing.withTmpDir(async (cwd) => {
      await Fixture.workspace(cwd);
      const git = Fixture.gitReads(cwd);
      const cliCalls: t.WorkspaceCli.Input[] = [];
      const deltaCalls: t.WorkspaceDelta.Git.FromRefArgs[] = [];
      const calls: string[] = [];
      const info = console.info;
      console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

      try {
        const result = await mainWith((input = {}) => {
          cliCalls.push(input);
          return runWith({
            deltaFromRef(args) {
              deltaCalls.push(args);
              return fromRefWith(git.invoke, args);
            },
          }, input);
        }, { argv: ['--since', 'baseline', '--dry-run'], options: { cwd } });
        expect(result).to.eql(true);
      } finally {
        console.info = info;
      }

      git.assertCalls();
      const policy = cliCalls[0]?.bumpPolicy;
      expect(cliCalls).to.eql([{
        argv: ['bump', '--since', 'baseline', '--dry-run'],
        cwd,
        bumpPolicy: policy,
      }]);
      expect(policy?.couplings).to.eql(bumpPolicy().couplings);
      expect(policy?.exclude?.('deploy/@tdb.slc/example')).to.eql(true);
      expect(policy?.followups?.({ cwd, plan: emptyPlan() })).to.eql(
        bumpPolicy().followups?.({ cwd, plan: emptyPlan() }),
      );
      expect(deltaCalls).to.eql([{ cwd, ref: 'baseline', release: 'patch', policy }]);
      const output = Cli.stripAnsi(calls.join('\n'));
      const deno = await Fs.readJson<{ version?: string }>(Fs.join(cwd, 'code/pkg-a/deno.json'));
      expect(output).to.not.include('Delta since baseline..HEAD');
      expect(output).to.include('deno task bump @scope/a --non-interactive');
      expect(output).to.include('@scope/a');
      expect(deno.data?.version).to.eql('1.0.0');
    });
  });

  it('fails clearly when since and from are both supplied', async () => {
    let error: Error | undefined;
    try {
      await main({ argv: ['--since', 'baseline', '--from', '@scope/a'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql('--since cannot be used with --from.');
  });

  it('couples tmpl bumps to workspace packages embedded in the repo template authorities', () => {
    const couplings = bumpPolicy().couplings ?? [];

    expect(couplings).to.deep.include({ from: 'code/sys/workspace', to: 'code/-tmpl' });
    expect(couplings).to.deep.include({ from: 'code/sys/std', to: 'code/-tmpl' });
    expect(couplings).to.deep.include({ from: 'code/-tmpl', to: 'code/sys.tools' });
  });

  it('couples driver-vite to workspace packages embedded in published fixture authorities', () => {
    const couplings = bumpPolicy().couplings ?? [];

    expect(couplings).to.deep.include({
      from: 'code/sys/http',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.deep.include({
      from: 'code/sys/std',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.deep.include({
      from: 'code/sys.ui/ui-react',
      to: 'code/sys.driver/driver-vite',
    });
    expect(couplings).to.not.deep.include({
      from: 'code/sys.driver/driver-vite',
      to: 'code/sys.driver/driver-vite',
    });
  });
});

/**
 * Helpers:
 */
function emptyPlan(): t.WorkspaceBump.PlanResult {
  return { roots: [], selected: [], selectedPaths: [] };
}

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}
