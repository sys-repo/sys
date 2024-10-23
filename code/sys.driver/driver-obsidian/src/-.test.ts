import { describe, expect, it, Pkg } from './-test.ts';

describe(`test module: ${Pkg.name}@${Pkg.version}`, () => {
  it('🐷 placeholder', () => {
    expect(123).to.equal(123);
  });
});
