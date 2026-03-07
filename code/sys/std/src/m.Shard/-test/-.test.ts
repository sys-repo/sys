import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Shard } from '../mod.ts';

describe(`Shard`, () => {
  it('API', async () => {
    const m = await import('@sys/std/shard');
    expect(m.Shard).to.equal(Shard);
  });
});
