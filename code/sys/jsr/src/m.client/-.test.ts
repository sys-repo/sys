import { describe, expect, it } from '../-test.ts';
import { Jsr, Fetch } from './mod.ts';

describe('@sys/jsr/client', () => {
  it('API', async () => {
    const root = await import('@sys/jsr');
    const client = await import('@sys/jsr/client');
    expect(root.Jsr).to.equal(Jsr);
    expect(client.Jsr).to.equal(Jsr);
    expect(client.Fetch).to.equal(Fetch);
  });
});
