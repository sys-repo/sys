import { describe, expect, it, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exports package identity', () => {
    expect(pkg.name).to.eql('@sys/ui');
  });
});
