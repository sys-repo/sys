import { type t, describe, expect, it } from '../../-test.ts';
import { commonPlugins } from '../u.plugins.ts';

describe('ViteConfig: common plugins', () => {
  it('default', async () => {
    const res = (await commonPlugins()).flat() as t.VitePlugin[];
    const includes = (text: string) => res.some((p) => p.name.toLowerCase().includes(text));
    expect(includes('wasm')).to.be.true;
    expect(includes('react')).to.be.true;
    expect(includes('deno')).to.be.true;
  });

  it('none (via options)', async () => {
    const res = await commonPlugins({ wasm: false, react: false, deno: false });
    expect(res.length).to.eql(0);
  });
});
