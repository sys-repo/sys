import { describe, expect, it, pkg } from '../-test.ts';

describe('module: @sys/markdown', () => {
  it('exposes package metadata', () => {
    expect(pkg.name).to.eql('@sys/markdown');
  });
});
