import { describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite @sys plain bridge integration', () => {
  it.skip('build: plain vite + deno plugin resolves import-map jsr aliases', async () => {
    // Repro marker: plain vite + deno plugin load-fallback attempts fs-read on canonical `jsr:...`
    // specifiers instead of resolving via deno-aware pipeline.
    // Keep skipped until vendored resolver/load path handles canonical jsr ids end-to-end.
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
