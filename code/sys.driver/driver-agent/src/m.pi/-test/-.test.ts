import { describe, expect, it } from '../../-test.ts';

import { Pi } from '../mod.ts';

describe(`@sys/driver-agent/pi`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi');
    expect(m.Pi).to.equal(Pi);
  });
});
