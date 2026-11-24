import { describe, expect, it, Pkg, pkg } from './mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exists', () => {
    console.info(`💦 Module`, pkg);
    expect(typeof pkg.name === 'string').to.be.true;
  });
});
