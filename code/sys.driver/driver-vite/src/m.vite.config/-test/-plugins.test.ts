import { describe, expect, it, type t } from '../../-test.ts';
import { commonPlugins } from '../u/u.plugins.ts';

describe('ViteConfig: common plugins', () => {
  it('default', async () => {
    const create = await commonPlugins();
    const res = create().flat() as t.VitePlugin[];
    const includes = (text: string) => res.some((p) => p.name.toLowerCase().includes(text));
    expect(includes('wasm')).to.be.true;
    expect(includes('react')).to.be.true;
    expect(includes('deno')).to.be.true;
  });

  it('none (via options)', async () => {
    const create = await commonPlugins({ wasm: false, react: false, deno: false });
    expect(create().length).to.eql(0);
  });

  it('constructs fresh plugin graphs', async () => {
    const create = await commonPlugins({ wasm: false });
    const first = create().flat() as t.VitePlugin[];
    const second = create().flat() as t.VitePlugin[];

    expect(first).not.to.equal(second);
    expect(first[0]).not.to.equal(second[0]);
    expect(first[1]).not.to.equal(second[1]);
  });
});
