import { type t, describe, expect, expectError, it } from '../../-test.ts';
import { Shard } from '../mod.ts';
import { Num } from '../common.ts';

describe('Shard.pick', () => {
  const policy = (shards: number): t.ShardPolicy => ({
    shards,
    strategy: 'prefix-range',
  });

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
});
