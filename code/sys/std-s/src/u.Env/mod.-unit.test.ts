import { describe, expect, it } from '../-test.ts';
import { Env } from './mod.ts';

describe('Env', () => {
  it('env.get', async () => {
    const env = await Env.load();
    expect(env.get('TEST_SAMPLE')).to.eql('foobar');
  });

  it('env.get ← key does not exist (empty string)', async () => {
    const env = await Env.load();
    expect(env.get('404')).to.eql('');
  });
});
