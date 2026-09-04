import { describe, expect, it } from '../../-test.ts';
import { Pkg } from '../mod.ts';

describe('Pkg (Server Tools)', () => {
  it('is not the [sys.std] client version, but surfaces all the [sys.std] interface', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg).to.not.equal(Base); // NB: different instance.
    expect(Object.isFrozen(Base)).to.eql(true);
    expect(Object.keys(Pkg).sort()).to.eql(Object.keys(Base).sort());

    // Shares all of the base interface methods except the extension override.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      if (key === 'Dist') continue; // NB: also overriden.
      expect(Pkg[key]).to.equal(Base[key]);
    }

    expect(Pkg.Dist).to.not.equal(Base.Dist);
  });
});
