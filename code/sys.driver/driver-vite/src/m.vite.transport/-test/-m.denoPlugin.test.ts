import { describe, expect, it } from '../../-test.ts';
import { ViteTransport } from '../mod.ts';

describe('ViteTransport.denoPlugin', () => {
  it('returns vite plugin transport pair', () => {
    const plugin = ViteTransport.denoPlugin();
    expect(Array.isArray(plugin)).to.eql(true);

    const names = (plugin as Array<{ name?: string }>).map((entry) => entry.name);
    expect(names).to.eql(['deno:prefix', 'deno']);
  });
});
