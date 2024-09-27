import { Fs } from '@sys/std-s';
import { describe, expect, it, TestVite } from './mod.ts';

describe('ViteConfig', () => {
  describe('TestVite', () => {
    it('TestVite.outDir', () => {
      const def = TestVite.outDir.default;
      expect(def).to.include('./.tmp/test/dist');

      const path1 = TestVite.outDir.random();
      const path2 = TestVite.outDir.random();

      expect(path1).to.include(def);
      expect(path2).to.include(def);
      expect(path1).to.not.eql(path2);
    });

    it('TestVite.run', async () => {
      const outDir = TestVite.outDir.random();
      const res = await TestVite.run({ outDir });

      expect(res.paths.outDir).to.eql(outDir);
      expect(res.cmd).to.include('deno task test:vite build --config');

      const entryHtml = Fs.join(res.paths.outDir, 'index.html');
      expect(await Fs.exists(entryHtml)).to.eql(true);
    });
  });
});
