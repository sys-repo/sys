import { describe, expect, it, pkg } from './-test.ts';

describe(`pkg: ${pkg.name}`, () => {
  it('exists', () => {
    expect(typeof pkg.name === 'string').to.be.true;
  });
});
