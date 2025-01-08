import { describe, expect, pkg, Pkg } from './-test.ts';

describe(pkg.name, () => {
  expect(pkg.name).to.equal(pkg.name);
  console.info('🐷', Pkg.toString(pkg));
});
