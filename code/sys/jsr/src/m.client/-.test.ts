import { describe, expect, it } from '../-test.ts';
import { Jsr, Fetch } from './mod.ts';

describe('@sys/jsr/client', () => {
  it('API', async () => {
    const m = await import('@sys/jsr/client');
    expect(m.Jsr).to.equal(Jsr);
    expect(m.Fetch).to.equal(Fetch);
  });
});
