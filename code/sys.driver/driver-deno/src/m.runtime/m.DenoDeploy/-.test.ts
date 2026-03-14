import { describe, expect, it } from '../../-test.ts';
import { DenoDeploy } from './mod.ts';

describe('DenoDeploy', () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoDeploy).to.equal(DenoDeploy);
  });
});
