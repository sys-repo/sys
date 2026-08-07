import { describe, Dispose, expect, it } from './common.ts';

describe('Dispose', () => {
  it('public export → canonical Dispose identity', async () => {
    const m = await import('@sys/std/dispose');
    expect(m.Dispose).to.equal(Dispose);
  });
});
