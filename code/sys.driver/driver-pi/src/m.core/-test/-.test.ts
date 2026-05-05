import { describe, expect, it } from '../../-test.ts';
import { Pi } from '../mod.ts';

describe(`@sys/driver-pi/core`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-pi/core');
    expect(m.Pi).to.equal(Pi);
  });
});
