import { describe, expect, it } from '../../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig', () => {
  it('exists on "@sys/ui-vite/server" import', async () => {
    const Import = await import('../mod.ts');
    expect(ViteConfig).to.equal(Import.ViteConfig);
  });
});
