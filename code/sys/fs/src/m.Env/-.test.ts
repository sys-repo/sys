import { describe, expect, it } from '../-test.ts';
import { Env } from './mod.ts';
import { Fs } from '../m.Fs/mod.ts';

const SAMPLE_ENV = `
# sample: src/m.Env
TEST_SAMPLE="foobar"    
`.slice(1);

describe('Env', () => {
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
