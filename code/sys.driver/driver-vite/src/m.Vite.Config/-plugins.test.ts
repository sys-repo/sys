import { type t, describe, expect, it } from '../-test.ts';
import { commonPlugins } from './u.plugins.ts';

describe('ViteConfig: common plugins', () => {
  it('default', async () => {
    const res = (await commonPlugins()).flat() as t.VitePlugin[];
    const includes = (name: string) => res.some((p) => p.name === name);
    expect(includes('vite-plugin-wasm')).to.be.true;
    expect(includes('vite:react-swc')).to.be.true;
  });

  it('none (via options)', async () => {
    const res = await commonPlugins({ wasm: false, react: false });
    expect(res.length).to.eql(0);
  });
});
