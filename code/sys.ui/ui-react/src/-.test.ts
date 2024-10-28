import { describe, expect, it, pkg } from './-test.ts';

describe(`test module: ${pkg.name}@${pkg.version}`, () => {
  it('🐷 placeholder', () => {
    expect(123).to.equal(123);
  });
});
