import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { PiCli } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.PiCli).to.equal(PiCli);
  });
});
