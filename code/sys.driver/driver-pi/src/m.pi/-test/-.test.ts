import { describe, expect, it } from '../../-test.ts';

import { Pi } from '../mod.ts';

describe(`@sys/driver-pi/pi`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-pi/pi');
    expect(m.Pi).to.equal(Pi);
  });
});
