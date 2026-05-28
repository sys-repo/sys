import { describe, expect, it } from '../../-test.ts';
import { WorkspaceDelta } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('@sys/workspace Delta.fromChangedFiles', () => {
  it('derives bump roots and dependent closure from changed files', () => {
    const collect = Fixture.collect({
      orderedPaths: ['code/sys/std', 'code/sys/cell', 'code/sys/tools'],
      edges: [{ from: 'code/sys/cell', to: 'code/sys/tools' }],
      candidates: [
        Fixture.candidate('code/sys/std', '@sys/std'),
        Fixture.candidate('code/sys/cell', '@sys/cell'),
        Fixture.candidate('code/sys/tools', '@sys/tools'),
      ],
    });

    const res = WorkspaceDelta.fromChangedFiles({
      collect,
      changedFiles: [
        './code/sys/cell/src/mod.ts',
        'code/sys/cell/src/mod.ts',
        'code/sys/std/src/mod.ts',
      ],
    });

    expect(res.changedFiles).to.eql(['code/sys/cell/src/mod.ts', 'code/sys/std/src/mod.ts']);
    expect(res.changedPkgPaths).to.eql(['code/sys/std', 'code/sys/cell']);
    expect(res.bumpRootPkgPaths).to.eql(['code/sys/std', 'code/sys/cell']);
    expect(res.bumpClosurePkgPaths).to.eql(['code/sys/std', 'code/sys/cell', 'code/sys/tools']);
    expect(res.skipped).to.eql([]);
  });

  it('reports changed files outside bumpable packages', () => {
    const collect = Fixture.collect({
      orderedPaths: ['code/sys/cell', 'deploy/private'],
      candidates: [Fixture.candidate('code/sys/cell', '@sys/cell')],
    });

    const res = WorkspaceDelta.fromChangedFiles({
      collect,
      changedFiles: ['README.md', 'deploy/private/src/mod.ts'],
    });

    expect(res.changedPkgPaths).to.eql([]);
    expect(res.bumpRootPkgPaths).to.eql([]);
    expect(res.bumpClosurePkgPaths).to.eql([]);
    expect(res.skipped).to.eql([
      { file: 'README.md', reason: 'outside-workspace-package' },
      { file: 'deploy/private/src/mod.ts', reason: 'outside-bump-candidates' },
    ]);
  });

  it('uses package path segment boundaries and longest owner matches', () => {
    const collect = Fixture.collect({
      orderedPaths: ['code/pkg', 'code/pkg-extra', 'code/pkg/sub'],
      candidates: [
        Fixture.candidate('code/pkg', '@scope/pkg'),
        Fixture.candidate('code/pkg-extra', '@scope/pkg-extra'),
        Fixture.candidate('code/pkg/sub', '@scope/pkg-sub'),
      ],
    });

    const res = WorkspaceDelta.fromChangedFiles({
      collect,
      changedFiles: [
        'code/pkg/sub/src/mod.ts',
        'code/pkg-extra/src/mod.ts',
        'code/pkg/src/mod.ts',
      ],
    });

    expect(res.changedPkgPaths).to.eql(['code/pkg', 'code/pkg-extra', 'code/pkg/sub']);
    expect(res.skipped).to.eql([]);
  });
});
