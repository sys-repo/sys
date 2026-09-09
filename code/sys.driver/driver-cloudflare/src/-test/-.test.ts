import { describe, expect, it, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exports package metadata', () => {
    expect(pkg.name).to.equal('@sys/driver-cloudflare');
  });
});
