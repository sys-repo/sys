import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { bumpOrderedPaths, collect, orderCandidates } from '../u/u.collect.ts';

describe('@sys/workspace/bump collect helpers', () => {
  it('preserves the declared workspace path on collected bump candidates', async () => {
    const fs = await Testing.dir('WorkspaceBump.collect.declared-path');
    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), { workspace: ['./code/pkg'] });
    await Fs.writeJson(Fs.join(fs.dir, 'code/pkg/deno.json'), {
      name: '@scope/pkg',
      version: '1.0.0',
    });
    const alias = await Testing.dir('WorkspaceBump.collect.declared-path.alias');
    const cwd = Fs.join(alias.dir, 'workspace');
    await Deno.symlink(fs.dir, cwd, { type: 'dir' });

    const result = await collect({
      cwd,
      orderedPaths: ['./code/pkg'],
      edges: [],
    });

    expect(
      result.candidates.map((candidate) => ({
        pkgPath: candidate.pkgPath,
        denoFilePath: candidate.denoFilePath,
      })),
    ).to.eql([{
      pkgPath: './code/pkg',
      denoFilePath: Fs.join(cwd, 'code/pkg/deno.json'),
    }]);
  });

  it('orders bump rows by topological workspace package path order', () => {
    const candidates = [
      { pkgPath: 'code/sys/workspace', name: '@sys/workspace' },
      { pkgPath: 'code/sys/std', name: '@sys/std' },
      { pkgPath: 'code/sys/types', name: '@sys/types' },
    ];

    const res = orderCandidates(candidates, [
      'code/sys/types',
      'code/sys/std',
      'code/sys/workspace',
    ]);

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

  it('reorders the bump picker paths to honor generated driver-pi coupling', () => {
    const res = bumpOrderedPaths(
      ['code/sys/std', 'code/sys.tools', 'code/sys.driver/driver-pi', 'code/sys/workspace'],
      [{ from: 'code/sys.driver/driver-pi', to: 'code/sys.tools' }],
    );

    expect(res).to.eql([
      'code/sys/std',
      'code/sys.driver/driver-pi',
      'code/sys.tools',
      'code/sys/workspace',
    ]);
  });
});
