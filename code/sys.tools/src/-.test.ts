import { describe, expect, Is, it, Pkg, pkg, type t } from './-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exists', () => {
    console.info(`💦 Module`, pkg);
    expect(Is.str(pkg.name)).to.be.true;
  });
});
