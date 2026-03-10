import { describe, expect, it } from '../-test.ts';
import { DenoDeps, DenoFile } from './mod.ts';

describe('@sys/driver-deno/runtime', () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoFile).to.equal(DenoFile);
    expect(m.DenoDeps).to.equal(DenoDeps);
  });
});
