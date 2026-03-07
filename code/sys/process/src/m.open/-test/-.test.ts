import { describe, expect, it } from '../../-test.ts';
import { Open } from '../mod.ts';
import { invokeDetached } from '../u.invokeDetached.ts';

describe('Open', () => {
  it('API', async () => {
    const m = await import('@sys/process');
    expect(m.Open).to.equal(Open);
    expect(m.Open.invokeDetached).to.equal(invokeDetached);
  });
});
