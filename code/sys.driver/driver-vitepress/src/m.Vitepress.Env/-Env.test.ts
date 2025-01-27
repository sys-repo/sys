import { type t, c, describe, expect, Fs, it, Testing } from '../-test.ts';
import { VitePress } from '../mod.ts';
import { assertEnvExists, Sample } from './-u.ts';
import { VitepressEnv } from './mod.ts';

describe('Vitepress.Env', () => {
  it('API', () => {
    expect(VitePress.Env).to.equal(VitepressEnv);
  });

  describe('Env.update', () => {
    it('insert deno.json → {tasks}', async () => {
      await Testing.retry(3, async () => {
        const sample = Sample.init();
        const { inDir } = sample;
        await VitepressEnv.update({ inDir });

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
          await VitepressEnv.update({ inDir, srcDir, silent: true });

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
