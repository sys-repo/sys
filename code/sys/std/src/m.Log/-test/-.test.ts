import { describe, expect, it } from '../../-test.ts';
import { Log } from '../mod.ts';

describe('Log', () => {
  it('API', async () => {
    const a = await import('../../mod.ts');
    const b = await import('@sys/std/log');
    expect(a.Log).to.equal(Log);
    expect(b.Log).to.equal(Log);
  });

  it('Log.levels', () => {
    expect(Log.levels).to.eql(['log', 'info', 'warn', 'error', 'debug']);
  });
});
