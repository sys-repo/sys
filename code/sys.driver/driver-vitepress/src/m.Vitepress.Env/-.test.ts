import { type t, assertEnvExists, c, describe, expect, Fs, it, Sample, Testing } from '../-test.ts';
import { VitePress } from '../mod.ts';

describe('Vitepress.Env', () => {
  describe('Env.update', () => {
    it('insert deno.json → {tasks}', async () => {
      await Testing.retry(3, async () => {
        const sample = Sample.init();
        const { inDir } = sample;
        await VitePress.Env.Tmpl.update({ inDir });

        console.info();
        console.info(c.bold(c.green(`Env.init()`)));
        console.info(`inDir:`);
        console.info(await sample.ls());

        await assertEnvExists(inDir);
      });
    });

    it('--srcDir parameter: source directory', async () => {
      const test = async (srcDir: t.StringDir | undefined, expectedSrcDir: t.StringDir) => {
        await Testing.retry(3, async () => {
          const sample = Sample.init();
          const { inDir } = sample;
          await VitePress.Env.Tmpl.update({ inDir, srcDir, silent: true });

          const file = await Deno.readTextFile(Fs.join(inDir, '.vitepress/config.ts'));
          const line = `srcDir: '${expectedSrcDir}',`;
          expect(file.includes(line)).to.eql(true, line);
        });
      };
      await test('../foo', '../foo'); //  NB: custom.
      await test(undefined, './docs'); // NB: default.
    });
  });
});
