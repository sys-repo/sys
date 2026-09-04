import { describe, expect, it, pkg } from '../-test.ts';

describe(pkg.name, () => {
  it('exports package identity', () => {
    expect(pkg.name).equal('@sys/archive');
  });
});
