import { describe, expect, it } from '../../../-test.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.Profiles).to.equal(Profiles);
  });
});
