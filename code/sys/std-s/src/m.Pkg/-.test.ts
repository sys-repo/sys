import { describe, expect, it } from '../-test.ts';
import { Pkg } from './mod.ts';

describe('Pkg (Server Tools)', () => {
  it('is not the "std" client instance, but surfaces interface', async () => {
    const { Pkg: Base } = await import('@sys/std/pkg');
    expect(Pkg).to.not.equal(Base); // NB: different instance.

    // Shares all of the base interface methods.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      const value = Base[key];
      expect(value).to.equal(Pkg[key]);
    }
  });
});
