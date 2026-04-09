import { describe, expect, it } from '../../../-test.ts';
import { PiCli } from '../mod.ts';

describe(`@sys/driver-agent/pi/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.PiCli).to.equal(PiCli);
    expect(m.PiCli.main).to.equal(PiCli.main);
    expect(m.PiCli.run).to.equal(PiCli.run);
  });
});
