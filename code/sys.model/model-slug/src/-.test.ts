import { describe, it, expect } from './-test.ts';
import { pkg } from './pkg.ts';
import { Pkg } from './common.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exists', () => {
    console.info(`💦 Module`, pkg);
    expect(typeof pkg.name === 'string').to.be.true;
  });
});
