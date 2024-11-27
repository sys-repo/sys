import { c, describe, expect, Fs, it } from '../-test.ts';
import { assertEnvExists, SAMPLE } from './-u.ts';
import { Env } from './m.Env.ts';
import { VitePress } from '../mod.ts';

describe('Vitepress.Env', () => {
  it('API', () => {
    expect(VitePress.Env).to.equal(Env);
    expect(VitePress.init).to.equal(Env.init);
  });

  describe('Env.init', () => {
    it('insert deno.json → {tasks}', async () => {
      const sample = await SAMPLE.init();
      const { inDir } = sample;
      await Env.init({ inDir });

      console.info(c.bold(c.green(`Env.init()`)));
      console.info(`inDir:`);
      console.info(await sample.ls());

      await assertEnvExists(inDir);
    });

    it('custom --srcDir parameter', async () => {
      const test = async (srcDir?: string, expectedSrcDir?: string) => {
        const sample = await SAMPLE.init();
        const { inDir } = sample;
        await Env.init({ inDir, srcDir });

        const file = await Deno.readTextFile(Fs.join(inDir, '.vitepress/config.ts'));
        const line = `srcDir: '${expectedSrcDir}',`;
        expect(file.includes(line)).to.eql(true, line);
      };
      await test('../foo', '../foo');
      await test(undefined, './docs'); // NB: default.
    });
  });
});
