import { c, describe, expect, it } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Env } from './mod.ts';

describe('Env', () => {
  describe('.env file', () => {
    const SAMPLE_ENV = `
# sample: src/m.Env
TEST_SAMPLE="foobar"    
`.slice(1);

    /**
     * Ensure the sample .env file exists.
     */
    it(':setup', async () => {
      const path = Fs.resolve('.env');
      if (!(await Fs.exists(path))) await Fs.write(path, SAMPLE_ENV);
    });

    it('env.get', async () => {
      const env = await Env.load();
      expect(env.get('TEST_SAMPLE')).to.eql('foobar');
    });

    it('env.get ← key does not exist (empty string)', async () => {
      const env = await Env.load();
      expect(env.get('404')).to.eql('');
    });
  });

  describe('Env.Is', () => {
    it('Is.vscode', () => {
      const flag = Env.Is.vscode;
      console.info(c.cyan(`Env.Is.vscode: ${c.white(String(flag))}`));
      expect(typeof flag === 'boolean').to.eql(true); // NB: this is all we can infer, as we don't know if the test runner is in VSCode.
    });
  });
});
