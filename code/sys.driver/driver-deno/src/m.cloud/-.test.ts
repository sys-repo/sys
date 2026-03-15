import { describe, expect, it } from '../-test.ts';
import { DenoDeploy } from './mod.ts';

describe(`@sys/driver-deno/cloud`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/cloud');
    expect(m.DenoDeploy).to.equal(DenoDeploy);
  });
});
