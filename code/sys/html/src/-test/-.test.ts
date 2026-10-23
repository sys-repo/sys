import { describe, expect, it, pkg } from '../-test.ts';

describe('module: @sys/html', () => {
  it('exposes package metadata', () => {
    expect(pkg.name).to.eql('@sys/html');
  });
});
