import { type t, describe, expect, expectError, it } from '../../-test.ts';
import { Shard } from '../mod.ts';
import { Num } from '../common.ts';

describe('Shard', () => {
  const policy = (shards: number): t.ShardPolicy => ({
    shards,
    strategy: 'prefix-range',
  });

  describe('Shard.pick', () => {
    it('maps 00 prefix to shard 0', () => {
      const sha = '00' + 'a'.repeat(62);
      expect(Shard.pick(policy(16), sha)).to.eql(0);
      expect(Shard.pick(policy(64), sha)).to.eql(0);
    });

    it('maps ff prefix to last shard', () => {
      const sha = 'ff' + 'b'.repeat(62);
      expect(Shard.pick(policy(16), sha)).to.eql(15);
      expect(Shard.pick(policy(64), sha)).to.eql(63);
    });

    it('maps first byte directly when shards = 256', () => {
      const sha = '2a' + '0'.repeat(62);
      expect(Shard.pick(policy(256), sha)).to.eql(42);
    });

    it('is deterministic', () => {
      const sha = '7f' + 'c'.repeat(62);
      const a = Shard.pick(policy(32), sha);
      const b = Shard.pick(policy(32), sha);
      expect(a).to.eql(b);
    });

    it('rejects invalid shard counts', () => {
      const sha = '01' + 'd'.repeat(62);
      const BAD = [0, -1, -0, 1.2, Number.NaN, Num.INFINITY, Num.MAX_INT];
      BAD.forEach((shards) => {
        expectError(() => Shard.pick(policy(shards), sha));
      });
    });

    it('rejects unsupported strategies', () => {
      const sha = '01' + 'e'.repeat(62);
      const invalid = { shards: 16, strategy: 'other' } as unknown as t.ShardPolicy;
      expectError(() => Shard.pick(invalid, sha));
    });

    it('policy picker: pick', () => {
      const sha = '2a' + 'f'.repeat(62);
      const policy = Shard.policy(16);
      expect(policy.pick(sha)).to.eql(Shard.pick(policy, sha));
    });

    it('policy picker: strategy override', () => {
      const sha = '2a' + 'f'.repeat(62);
      const policy = Shard.policy(16, 'prefix-range');
      expect(policy.pick(sha)).to.eql(Shard.pick(policy, sha));
    });
  });

  describe('Shard.meta', () => {
    it('returns canonical metadata shape', () => {
      const sha = '2a' + '0'.repeat(62);
      const p = policy(64);
      const meta = Shard.meta(p, sha);
      expect(meta).to.eql({
        strategy: 'prefix-range',
        total: 64,
        index: Shard.pick(p, sha),
      });
    });

    it('is deterministic for the same input', () => {
      const sha = '7f' + 'c'.repeat(62);
      const p = policy(32);
      const a = Shard.meta(p, sha);
      const b = Shard.meta(p, sha);
      expect(a).to.eql(b);
    });
  });

  describe('Shard.policy', () => {
    it('policy picker: invalid shard count', () => {
      const sha = '2a' + 'f'.repeat(62);
      const policy = Shard.policy(0);
      expectError(() => policy.pick(sha));
    });

    it('policy picker: invalid strategy', () => {
      const sha = '2a' + 'f'.repeat(62);
      const policy = Shard.policy(16, 'prefix-range');
      const invalid = { ...policy, strategy: 'other' } as unknown as t.ShardPolicy;
      expectError(() => Shard.pick(invalid, sha));
    });
  });
});
