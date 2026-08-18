import type { BootstrapStatus as BootstrapStatusContract } from '@sys/server/t';
import { describe, expect, it } from '../../-test.ts';
import { BootstrapStatus } from '../mod.ts';

describe('BootstrapStatus/API', () => {
  it('exports one frozen start surface', async () => {
    const module = await import('@sys/server/bootstrap/status');
    const contract: BootstrapStatusContract.Lib = BootstrapStatus;
    expect(module.BootstrapStatus).to.equal(contract);
    expect(Object.keys(BootstrapStatus)).to.eql(['start']);
    expect(Object.isFrozen(BootstrapStatus)).to.eql(true);
  });
});
