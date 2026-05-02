import { describe, expect, it } from '../../../-test.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-pi/cli/Profiles`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-pi/cli');
    expect(m.Profiles).to.equal(Profiles);
    expect(m.Profiles.main).to.equal(Profiles.main);
    expect(m.Profiles.run).to.equal(Profiles.run);
    expect(m.Profiles.menu).to.equal(Profiles.menu);
  });
});
