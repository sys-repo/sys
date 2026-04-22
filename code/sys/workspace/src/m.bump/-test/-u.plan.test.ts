import { describe, expect, it } from '../../-test.ts';
import { dependentClosure, plan } from '../u.plan.ts';

describe('@sys/workspace/bump plan helpers', () => {
  it('includes generated tmpl coupling in the bump closure', () => {
    const res = dependentClosure(['code/-tmpl'], [{ from: 'code/-tmpl', to: 'code/sys.tools' }], [
      'code/-tmpl',
      'code/sys.tools',
    ]);

    expect(res).to.include('code/-tmpl');
    expect(res).to.include('code/sys.tools');
  });

  it('includes generated driver-agent coupling in the bump closure', () => {
    const res = dependentClosure(
      ['code/sys.driver/driver-agent'],
      [{ from: 'code/sys.driver/driver-agent', to: 'code/sys.tools' }],
      ['code/sys.driver/driver-agent', 'code/sys.tools'],
    );

    expect(res).to.include('code/sys.driver/driver-agent');
    expect(res).to.include('code/sys.tools');
  });

  it('dedupes overlapping multi-root closures and preserves topological order', () => {
    const res = dependentClosure(
      ['code/pkg-b', 'code/pkg-a', 'code/pkg-a'],
      [
        { from: 'code/pkg-a', to: 'code/pkg-z' },
        { from: 'code/pkg-b', to: 'code/pkg-z' },
      ],
      ['code/pkg-a', 'code/pkg-b', 'code/pkg-z'],
    );

    expect(res).to.eql(['code/pkg-a', 'code/pkg-b', 'code/pkg-z']);
  });

  it('returns roots in stable workspace order', async () => {
    const collect = {
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

    const res = await plan({ collect, rootPkgPaths: ['code/pkg-b', 'code/pkg-a'] });

    expect(res.roots.map((root) => root.name)).to.eql(['@scope/a', '@scope/b']);
    expect(res.selected.map((candidate) => candidate.name)).to.eql([
      '@scope/a',
      '@scope/b',
      '@scope/z',
    ]);
  });
});

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
