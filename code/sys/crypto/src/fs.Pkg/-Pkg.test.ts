import { describe, expect, it } from '../-test.ts';
import { Pkg } from './mod.ts';

describe('Pkg (Server Tools)', () => {
  it('is not the [sys.std] client version, but surfaces all the [sys.std] interface', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg).to.not.equal(Base); // NB: different instance.

    // Shares all of the base interface methods.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      if (key === 'Dist') continue; // NB: also overriden.
      const value = Base[key];
      expect(value).to.equal(Pkg[key]);
    }
  });
});
