import { describe, expect, Fs, it, pkg, SAMPLE, Testing } from '../../-test.ts';
import { writeLocalFixtureImports } from './u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

describe('Vite.build (transitive jsr)', () => {
  describe('@std/path', () => {
    it('resolves transitive jsr dependencies from remote deno modules', async () => {
      await Testing.retry(2, async () => {
        const fs = await SAMPLE.fs('Vite.build.std-path');
        const cwd = fs.join('fixture');
        await Fs.copy(SAMPLE.Dirs.sampleStdPath, cwd);
        const restore = await writeLocalFixtureImports(cwd);

        try {
          const res = await Vite.build({
            cwd,
            paths: {
              cwd,
              app: {
                entry: 'index.html',
                outDir: 'dist',
                base: './',
              },
            },
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
          const files = await Fs.glob(outDir).find('**/*.js');
          const texts = await Promise.all(files.map(async (file) => (await Fs.readText(file.path)).data ?? ''));
          expect(texts.some((text) => text.includes('/@id/__x00__deno::'))).to.eql(false);
        } finally {
          await restore();
        }
      });
    });
  });
});
