import { describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite @sys plain bridge integration', () => {
  it('build: plain vite + deno plugin resolves import-map jsr aliases', async () => {
    await Testing.retry(2, async () => {
      const fs = SAMPLE.fs('Vite.bridge.plain.build');
      await Fs.copy(SAMPLE.Dirs.sampleBridgePlain, fs.dir);

      const res = await Vite.build({
        cwd: fs.dir,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      });

      expect(res.ok).to.eql(true);

      const outDir = Fs.join(res.paths.cwd, res.paths.app.outDir);
      const html = (await Fs.readText(Fs.join(outDir, 'index.html'))).data ?? '';
      expect(html).to.include('<title>Sample-Bridge-Plain</title>');
    });
  });
});
