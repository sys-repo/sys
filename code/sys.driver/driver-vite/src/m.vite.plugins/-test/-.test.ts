import { describe, expect, it } from '../../-test.ts';
import { VitePlugins } from '../mod.ts';

describe('VitePlugins', () => {
  it('API', async () => {
    const m = await import('@sys/driver-vite/plugins');
    expect(m.VitePlugins).to.equal(VitePlugins);
  });
});
