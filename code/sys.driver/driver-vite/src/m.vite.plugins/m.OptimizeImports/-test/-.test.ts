import { describe, expect, it } from '../../../-test.ts';
import { VitePlugins } from '../../mod.ts';
import { OptimizeImportsPlugin } from '../mod.ts';

describe('VitePlugins.OptimizeImports', () => {
  it('API', async () => {
    const m = await import('@sys/driver-vite/plugins');
    expect(m.VitePlugins.OptimizeImports).to.equal(OptimizeImportsPlugin);
    expect(VitePlugins.OptimizeImports).to.equal(OptimizeImportsPlugin);
  });
});
