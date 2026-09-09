import { describe, expect, it } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';

describe('HttpCmd', () => {
  it('API', async () => {
    const m = await import('@sys/http/cmd');
    expect(m.HttpCmd).to.equal(HttpCmd);
  });
});
