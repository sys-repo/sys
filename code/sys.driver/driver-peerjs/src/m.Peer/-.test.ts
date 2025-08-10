import { type t, describe, it, expect, Testing } from '../-test.ts';
import { Peer } from './mod.ts';

describe('Peer', () => {
  it('API', async () => {
    const m = await import('@sys/driver-peerjs');
    expect(m.Peer).to.equal(Peer);
  });
});
