import { describe, expect, it } from '../../-test.ts';
import { R2 } from '../mod.ts';

describe('@sys/driver-cloudflare/r2', () => {
  it('API', async () => {
    const m = await import('@sys/driver-cloudflare/r2');
    expect(m.R2).to.equal(R2);
  });
});
