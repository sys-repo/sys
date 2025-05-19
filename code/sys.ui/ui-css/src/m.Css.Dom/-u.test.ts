import { describe, expect, it } from '../-test.ts';
import { AlphanumericWithHyphens } from './u.ts';

describe('util:validation', () => {
  it('AlphanumericWithHyphens', () => {
    const a = AlphanumericWithHyphens.safeParse('foo-bar');
    const b = AlphanumericWithHyphens.safeParse('-nope');

    expect(a.success).to.eql(true);
    expect(b.success).to.eql(false);
  });
});
