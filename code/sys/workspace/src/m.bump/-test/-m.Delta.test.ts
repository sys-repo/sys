import { describe, expect, it, type t } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe('@sys/workspace/bump Delta', () => {
  it('derives bump roots and dependent closure from changed files', () => {
    const collect = fixture.collect({
      orderedPaths: ['code/sys/std', 'code/sys/cell', 'code/sys/tools'],
      edges: [{ from: 'code/sys/cell', to: 'code/sys/tools' }],
      candidates: [
        fixture.candidate('code/sys/std', '@sys/std'),
        fixture.candidate('code/sys/cell', '@sys/cell'),
        fixture.candidate('code/sys/tools', '@sys/tools'),
      ],
    });

    const res = WorkspaceBump.Delta.fromChangedFiles({
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
    const collect = fixture.collect({
      orderedPaths: ['code/sys/cell', 'deploy/private'],
      candidates: [fixture.candidate('code/sys/cell', '@sys/cell')],
    });

    const res = WorkspaceBump.Delta.fromChangedFiles({
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
    const collect = fixture.collect({
      orderedPaths: ['code/pkg', 'code/pkg-extra', 'code/pkg/sub'],
      candidates: [
        fixture.candidate('code/pkg', '@scope/pkg'),
        fixture.candidate('code/pkg-extra', '@scope/pkg-extra'),
        fixture.candidate('code/pkg/sub', '@scope/pkg-sub'),
      ],
    });

    const res = WorkspaceBump.Delta.fromChangedFiles({
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

/**
 * Helpers:
 */
const fixture = {
  collect(args: {
    readonly orderedPaths: readonly t.StringPath[];
    readonly edges?: readonly t.WorkspaceBump.PackageEdge[];
    readonly candidates: readonly t.WorkspaceBump.Candidate[];
  }): t.WorkspaceBump.CollectResult {
    return {
      cwd: '/tmp/workspace',
      release: 'patch',
      orderedPaths: args.orderedPaths,
      edges: args.edges ?? [],
      candidates: args.candidates,
    };
  },

  candidate(pkgPath: t.StringPath, name: string): t.WorkspaceBump.Candidate {
    return {
      pkgPath,
      denoFilePath: `${pkgPath}/deno.json`,
      name,
      version: {
        current: { major: 1, minor: 0, patch: 0, prerelease: [], build: [] },
        next: { major: 1, minor: 0, patch: 1, prerelease: [], build: [] },
      },
    };
  },
} as const;
