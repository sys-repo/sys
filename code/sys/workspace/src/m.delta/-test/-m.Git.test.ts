import { describe, expect, it } from '../../-test.ts';
import { WorkspaceDelta } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('@sys/workspace Delta.Git.fromNameStatus', () => {
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
});
