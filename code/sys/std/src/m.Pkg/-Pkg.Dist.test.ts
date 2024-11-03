import { describe, expect, it } from '../-test.ts';
import { Dist, Pkg } from './mod.ts';

describe('Pkg.Dist', () => {
  it('API', () => {
    expect(Pkg.Dist).to.equal(Dist);
  });
});
