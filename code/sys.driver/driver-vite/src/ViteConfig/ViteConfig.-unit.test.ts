import { describe, expect, it, ROOT_DENOFILE } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig', () => {
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
      const a = await ViteConfig.workspace(); // NB: finds root workspace
      const b = await ViteConfig.workspace(ROOT_DENOFILE.path);
      const c = await ViteConfig.workspace(ROOT_DENOFILE.json); // NB: existing {object}.
      const d = await ViteConfig.workspace(undefined, { walkup: false });

      expect(a.exists).to.eql(true);
      expect(b.exists).to.eql(true);
      expect(c.exists).to.eql(true);
      expect(a.paths.includes('./code/sys/std')).to.eql(true);
      expect(a.paths).to.eql(b.paths);
      expect(d.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
    });
  });
});
