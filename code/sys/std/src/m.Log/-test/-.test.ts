import { describe, expect, it } from '../../-test.ts';
import { Log } from '../mod.ts';

describe('Log', () => {
  it('API', async () => {
    const root = await import('../../mod.ts');
    const leaf = await import('@sys/std/log');
    expect('Log' in root).to.eql(false);
    expect(leaf.Log).to.equal(Log);
  });

  it('Log.levels', () => {
    expect(Log.levels).to.eql(['log', 'info', 'warn', 'error', 'debug']);
  });
});
