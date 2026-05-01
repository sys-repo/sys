import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../mod.ts';
import { Profiles } from '../../m.cli.profiles/mod.ts';

describe(`@sys/driver-agent/pi/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-agent/pi/cli');
    expect(m.Profiles).to.equal(Profiles);
    expect(m.Cli).to.equal(Cli);
    expect(m.Cli.main).to.equal(Cli.main);
    expect(m.Cli.run).to.equal(Cli.run);
  });
});
