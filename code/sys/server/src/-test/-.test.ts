import { describe, it, expect, Pkg, pkg } from '../-test.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exports package identity', () => {
    expect(pkg.name).equal('@sys/server');
  });
});
