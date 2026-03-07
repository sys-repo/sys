import { describe, expect, it } from '../-test.ts';
import { Conn } from './m.Conn.ts';
import { Peer } from './mod.ts';

describe('Peer', () => {
  it('API', async () => {
    const m = await import('@sys/driver-peerjs');
    expect(m.Peer).to.equal(Peer);
    expect(m.Peer.Conn).to.equal(Conn);
  });

  describe('Peer.Conn', () => {
    describe('Conn.toDyads', () => {
      it('handles an empty input list', () => {
        expect(Conn.toDyads([])).to.eql([]);
        expect(Conn.toDyads()).to.eql([]);
      });

      it('deduplicates peers and returns all unique dyads, lexicographically ordered inside and out', () => {
        const peers = ['b', 'a', 'c', 'a']; // duplicates + unsorted
        const result = Conn.toDyads(peers);

        const expected = [
          ['a', 'b'],
          ['a', 'c'],
          ['b', 'c'],
        ] as const;

        expect(result).to.eql(expected);
      });

      it('omits dyads when fewer than two unique peers supplied', () => {
        const result = Conn.toDyads(['single-peer']);
        expect(result).to.eql([]);
      });
    });
  });
});
