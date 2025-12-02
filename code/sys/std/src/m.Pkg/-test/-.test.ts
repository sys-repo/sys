import { type t, describe, expect, it, pkg } from '../../-test.ts';
import { DEFAULTS } from '../common.ts';
import { Pkg, Dist } from '../mod.ts';

describe('Pkg', () => {
  it('API', async () => {
    const m = await import('@sys/std/pkg');
    expect(m.Pkg).to.equal(Pkg);
    expect(m.Dist).to.equal(Dist);

    expect(m.Pkg.Dist).to.equal(Dist);
  });
});
