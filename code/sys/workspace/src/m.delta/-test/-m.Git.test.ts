import { describe, expect, it, type t, Testing } from '../../-test.ts';
import { WorkspaceDelta } from '../mod.ts';
import { fromRefWith } from '../m.Git/u.fromRef.ts';
import { Fixture } from './u.fixture.ts';

describe('@sys/workspace Delta.Git.fromNameStatus', {
  permissions: { read: true, write: true, env: true, run: false },
}, () => {
  describe('raw name-status lines', () => {
    it('maps add, modify, and delete paths', () => {
      const collect = Fixture.collect({
        orderedPaths: ['code/pkg-a', 'code/pkg-b'],
        candidates: [
          Fixture.candidate('code/pkg-a', '@scope/a'),
          Fixture.candidate('code/pkg-b', '@scope/b'),
        ],
      });

      const res = WorkspaceDelta.Git.fromNameStatus({
        collect,
        nameStatus: [
          'M\tcode/pkg-b/src/mod.ts',
          'A\tcode/pkg-a/README.md',
          'D\tcode/pkg-a/src/old.ts',
        ],
      });

      expect(res.changedFiles).to.eql([
        'code/pkg-b/src/mod.ts',
        'code/pkg-a/README.md',
        'code/pkg-a/src/old.ts',
      ]);
      expect(res.changedPkgPaths).to.eql(['code/pkg-a', 'code/pkg-b']);
      expect(res.bumpRootPkgPaths).to.eql(['code/pkg-a', 'code/pkg-b']);
      expect(res.skipped).to.eql([]);
    });

    it('maps rename records to previous and current paths', () => {
      const collect = Fixture.collect({
        orderedPaths: ['code/pkg-a', 'code/pkg-b'],
        candidates: [
          Fixture.candidate('code/pkg-a', '@scope/a'),
          Fixture.candidate('code/pkg-b', '@scope/b'),
        ],
      });

      const res = WorkspaceDelta.Git.fromNameStatus({
        collect,
        nameStatus: ['R100\tcode/pkg-a/src/old.ts\tcode/pkg-b/src/new.ts'],
      });

      expect(res.changedFiles).to.eql(['code/pkg-a/src/old.ts', 'code/pkg-b/src/new.ts']);
      expect(res.changedPkgPaths).to.eql(['code/pkg-a', 'code/pkg-b']);
    });

    it('maps copy records to the new path only', () => {
      const collect = Fixture.collect({
        orderedPaths: ['code/pkg-a', 'code/pkg-c'],
        candidates: [
          Fixture.candidate('code/pkg-a', '@scope/a'),
          Fixture.candidate('code/pkg-c', '@scope/c'),
        ],
      });

      const res = WorkspaceDelta.Git.fromNameStatus({
        collect,
        nameStatus: ['C100\tcode/pkg-a/src/source.ts\tcode/pkg-c/src/copied.ts'],
      });

      expect(res.changedFiles).to.eql(['code/pkg-c/src/copied.ts']);
      expect(res.changedPkgPaths).to.eql(['code/pkg-c']);
    });
  });

  describe('structured records', () => {
    it('dedupes through changed-file normalization', () => {
      const collect = Fixture.collect({
        orderedPaths: ['code/pkg-a', 'code/pkg-b'],
        candidates: [
          Fixture.candidate('code/pkg-a', '@scope/a'),
          Fixture.candidate('code/pkg-b', '@scope/b'),
        ],
      });

      const res = WorkspaceDelta.Git.fromNameStatus({
        collect,
        nameStatus: [
          {
            status: 'R90',
            previousPath: './code/pkg-a/src/old.ts',
            path: 'code/pkg-b/src/new.ts',
          },
          'M\tcode/pkg-b/src/new.ts',
        ],
      });

      expect(res.changedFiles).to.eql(['code/pkg-a/src/old.ts', 'code/pkg-b/src/new.ts']);
      expect(res.changedPkgPaths).to.eql(['code/pkg-a', 'code/pkg-b']);
    });
  });

  describe('malformed input', () => {
    it('throws clearly for malformed nonblank raw lines', () => {
      const collect = Fixture.collect({
        orderedPaths: ['code/pkg-a'],
        candidates: [Fixture.candidate('code/pkg-a', '@scope/a')],
      });

      const fn = () =>
        WorkspaceDelta.Git.fromNameStatus({
          collect,
          nameStatus: ['R100\tcode/pkg-a/src/old.ts'],
        });

      expect(fn).to.throw(/malformed git name-status line/i);
    });
  });

  describe('git ref baselines', () => {
    it('classifies changed packages by baseline version state', async () => {
      await Testing.withTmpDir(async (cwd) => {
        const graphPath = await Fixture.workspace(cwd);
        const git = Fixture.gitReads(cwd);
        const res = await fromRefWith(git.invoke, { cwd, graphPath, ref: 'baseline' });

        git.assertCalls();
        expect(res.ref).to.eql('baseline');
        expect(res.head).to.eql('HEAD');
        expect(res.graphPath).to.eql(graphPath);
        expect(res.changedPkgPaths).to.eql(['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
        expect(res.needsBumpPkgPaths).to.eql(['code/pkg-a']);
        expect(res.alreadyBumpedPkgPaths).to.eql(['code/pkg-b']);
        expect(res.newPkgPaths).to.eql(['code/pkg-c']);
        expect(res.bumpRootPkgPaths).to.eql(['code/pkg-a']);
        expect(res.bumpClosurePkgPaths).to.eql(['code/pkg-a', 'code/pkg-c']);
      });
    });

    it('fails clearly when the graph snapshot is missing, before invoking Git', async () => {
      await Testing.withTmpDir(async (cwd) => {
        const calls: t.Process.InvokeArgs[] = [];
        const invoke: t.Process.Lib['invoke'] = (args) => {
          calls.push(args);
          throw new Error('Unexpected Git invocation');
        };
        let error: Error | undefined;
        try {
          await fromRefWith(invoke, {
            cwd,
            ref: 'baseline',
            graphPath: `${cwd}/missing.graph.json`,
          });
        } catch (err) {
          error = err as Error;
        }

        expect(error?.message).to.eql(
          `Workspace graph snapshot not found: ${cwd}/missing.graph.json`,
        );
        expect(calls).to.eql([]);
      });
    });

    it('propagates a failed diff without requesting baseline manifests', async () => {
      await Testing.withTmpDir(async (cwd) => {
        await Fixture.workspace(cwd);
        const git = Fixture.gitReads(cwd);
        git.outputs[0] = Fixture.output('', 128, 'bad revision');
        let error: Error | undefined;
        try {
          await fromRefWith(git.invoke, { cwd, ref: 'baseline' });
        } catch (err) {
          error = err as Error;
        }

        expect(error?.message).to.eql('Git diff failed for baseline..HEAD: bad revision');
        git.assertCalls(1);
      });
    });

    it('rejects malformed baseline manifest JSON', async () => {
      await Testing.withTmpDir(async (cwd) => {
        await Fixture.workspace(cwd);
        const git = Fixture.gitReads(cwd);
        git.outputs[1] = Fixture.output('{');
        let error: Error | undefined;
        try {
          await fromRefWith(git.invoke, { cwd, ref: 'baseline' });
        } catch (err) {
          error = err as Error;
        }

        expect(error?.message).to.eql(
          'Could not parse baseline manifest at baseline:code/pkg-a/deno.json.',
        );
        git.assertCalls(2);
      });
    });
  });
});
