import { describe, it, expect, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exports package metadata', () => {
    expect(pkg).eql({ name: '@sys/server', version: '0.0.0' });
  });
});
