import { describe, expect, it } from '../../-test.ts';
import { ViteTransport } from '../mod.ts';

describe(`ViteTransport`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-vite');
    expect(m.ViteTransport).to.equal(ViteTransport);
  });
});
