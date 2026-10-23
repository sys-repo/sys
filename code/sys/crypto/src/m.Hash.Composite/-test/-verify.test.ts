import { describe, expect, it, type t, Time } from '../../-test.ts';
import { CompositeHash } from '../mod.ts';

describe('CompositeHash.verify', () => {
  const setup = () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5, 6]);
    const hash = CompositeHash.builder().add('./apple/a', a).add('./zoo/b', b);
    return { a, b, hash };
  };

  it('matching loaded bytes → valid with equal source and recomputed hashes', async () => {
    const { a, b, hash } = setup();
    const res = await CompositeHash.verify(hash, async (e) => {
      await Time.wait(0);
      if (e.part === './apple/a') return a;
      if (e.part === './zoo/b') return b;
    });

    expect(res.hash.a).to.eql(hash.toObject());
    expect(res.hash.b).to.eql(hash.toObject());
    expect(res.is.valid).to.eql(true);
    expect(res.error).to.eql(undefined);
  });

  it('changed loaded bytes → invalid without a loader error', async () => {
    const { a, hash } = setup();
    const b = new Uint8Array([11, 22, 33]);
    const res = await CompositeHash.verify(hash, async (e) => {
      await Time.wait(0);
      if (e.part === './apple/a') return a;
      if (e.part === './zoo/b') return b;
    });

    expect(res.hash.a).to.eql(hash.toObject());
    expect(res.hash.b).to.not.eql(hash.toObject());
    expect(res.is.valid).to.eql(false);
    expect(res.error).to.eql(undefined);
  });

  it('different verification algorithm → invalid despite unchanged bytes', async () => {
    const test = async (algo: t.CompositeHash.AlgoInput) => {
      const sample = setup();
      const res = await CompositeHash.verify(sample.hash, {
        algo,
        async loader(e) {
          await Time.wait(0);
          if (e.part === './apple/a') return sample.a;
          if (e.part === './zoo/b') return sample.b;
        },
      });
      expect(res.is.valid).to.eql(false);
    };

    await test('sha1');
    await test(() => '0x1234');
  });

  it('missing loaded bytes → reports the part retrieval failure', async () => {
    const { a, hash } = setup();
    const res = await CompositeHash.verify(hash, async (e) => {
      await Time.wait(0);
      if (e.part === './apple/a') return a;
    });
    expect(res.error?.message).to.include('loader did not return content for part');
  });
});
