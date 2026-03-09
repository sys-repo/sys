import { describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite.build (transitive jsr)', () => {
  describe('@std/path', () => {
    it('resolves transitive jsr dependencies from remote deno modules', async () => {
      await Testing.retry(2, async () => {
        const fs = SAMPLE.fs('Vite.build.std-path');
        await Fs.copy(SAMPLE.Dirs.sampleStdPath, fs.dir);

        const res = await Vite.build({
          cwd: fs.dir,
          pkg,
          silent: true,
          spinner: false,
          exitOnError: false,
        });
        if (!res.ok) console.warn(res.toString());

        expect(res.ok).to.eql(true);

        const outDir = Fs.join(res.paths.cwd, res.paths.app.outDir);
        const html = (await Fs.readText(Fs.join(outDir, 'index.html'))).data ?? '';
        expect(html).to.include('<title>Sample-Std-Path</title>');
      });
    });
  });
});
