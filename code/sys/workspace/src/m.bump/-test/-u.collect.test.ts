import { describe, expect, it } from '../../-test.ts';
import { bumpOrderedPaths, orderCandidates } from '../u.collect.ts';

describe('@sys/workspace/bump collect helpers', () => {
  it('orders bump rows by topological workspace package path order', () => {
    const candidates = [
      { pkgPath: 'code/sys/workspace', name: '@sys/workspace' },
      { pkgPath: 'code/sys/std', name: '@sys/std' },
      { pkgPath: 'code/sys/types', name: '@sys/types' },
    ];

    const res = orderCandidates(candidates, ['code/sys/types', 'code/sys/std', 'code/sys/workspace']);

    expect(res.map((candidate) => candidate.name)).to.eql([
      '@sys/types',
      '@sys/std',
      '@sys/workspace',
    ]);
  });

  it('keeps unmatched candidates at the end in stable path order', () => {
    const candidates = [
      { pkgPath: 'code/sys/workspace', name: '@sys/workspace' },
      { pkgPath: 'code/extra/zeta', name: '@extra/zeta' },
      { pkgPath: 'code/sys/std', name: '@sys/std' },
      { pkgPath: 'code/extra/alpha', name: '@extra/alpha' },
    ];

    const res = orderCandidates(candidates, ['code/sys/std', 'code/sys/workspace']);

    expect(res.map((candidate) => candidate.name)).to.eql([
      '@sys/std',
      '@sys/workspace',
      '@extra/alpha',
      '@extra/zeta',
    ]);
  });

  it('reorders the bump picker paths to honor generated tmpl coupling', () => {
    const res = bumpOrderedPaths(
      ['code/sys/std', 'code/sys.tools', 'code/-tmpl', 'code/sys/workspace'],
      [{ from: 'code/-tmpl', to: 'code/sys.tools' }],
    );

    expect(res).to.eql([
      'code/sys/std',
      'code/-tmpl',
      'code/sys.tools',
      'code/sys/workspace',
    ]);
  });

  it('reorders the bump picker paths to honor generated driver-agent coupling', () => {
    const res = bumpOrderedPaths(
      ['code/sys/std', 'code/sys.tools', 'code/sys.driver/driver-agent', 'code/sys/workspace'],
      [{ from: 'code/sys.driver/driver-agent', to: 'code/sys.tools' }],
    );

    expect(res).to.eql([
      'code/sys/std',
      'code/sys.driver/driver-agent',
      'code/sys.tools',
      'code/sys/workspace',
    ]);
  });
});
