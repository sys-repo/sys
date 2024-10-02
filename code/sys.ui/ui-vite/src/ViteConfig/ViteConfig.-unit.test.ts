import { describe, expect, it, rootDenofileJson } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig', () => {
  const ROOT_PATH = '../../../deno.json';

  it('Config.outDir', () => {
    const outDir = ViteConfig.outDir;
    expect(outDir.default).to.include('./dist');

    const path1 = outDir.test.random();
    const path2 = outDir.test.random();
    const path3 = outDir.test.random('foo');

    expect(path1).to.include(outDir.test.base);
    expect(path2).to.include(outDir.test.base);
    expect(path3.endsWith('-foo')).to.be.true;
    expect(path1).to.not.eql(path2);
  });

  describe('Config.workspace', () => {
    it('load', async () => {
      const a = await ViteConfig.workspace();
      const b = await ViteConfig.workspace(ROOT_PATH);
      const c = await ViteConfig.workspace(rootDenofileJson);

      expect(a.exists).to.eql(false);
      expect(b.exists).to.eql(true);
      expect(c.exists).to.eql(true);
      expect(b.paths.includes('./code/sys/std')).to.eql(true);
    });
  });
});
