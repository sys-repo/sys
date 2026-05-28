import { describe, expect, it } from '../../-test.ts';
import { plan } from '../u/u.plan.ts';

describe('@sys/workspace/bump plan helpers', () => {
  it('returns roots in stable workspace order', async () => {
    const collect = collectFixture();

    const res = await plan({ collect, rootPkgPaths: ['code/pkg-b', 'code/pkg-a'] });

    expect(res.roots.map((root) => root.name)).to.eql(['@scope/a', '@scope/b']);
    expect(res.selected.map((candidate) => candidate.name)).to.eql([
      '@scope/a',
      '@scope/b',
      '@scope/z',
    ]);
  });

  it('minimizes selected roots covered by another selected root closure', async () => {
    const collect = collectFixture();

    const res = await plan({ collect, rootPkgPaths: ['code/pkg-a', 'code/pkg-z'] });

    expect(res.roots.map((root) => root.name)).to.eql(['@scope/a']);
    expect(res.selected.map((candidate) => candidate.name)).to.eql(['@scope/a', '@scope/z']);
  });
});

function collectFixture() {
  return {
    cwd: '/tmp/workspace',
    release: 'patch',
    orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-z'],
    edges: [
      { from: 'code/pkg-a', to: 'code/pkg-z' },
      { from: 'code/pkg-b', to: 'code/pkg-z' },
    ],
    candidates: [
      candidate('code/pkg-a', '@scope/a'),
      candidate('code/pkg-b', '@scope/b'),
      candidate('code/pkg-z', '@scope/z'),
    ],
  } as const;
}

function candidate(pkgPath: string, name: string) {
  return {
    pkgPath,
    denoFilePath: `${pkgPath}/deno.json`,
    name,
    version: {
      current: { major: 1, minor: 0, patch: 0, prerelease: [], build: [] },
      next: { major: 1, minor: 0, patch: 1, prerelease: [], build: [] },
    },
  };
}
