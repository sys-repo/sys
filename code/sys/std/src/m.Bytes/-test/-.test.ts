import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Bytes, utf8ByteLength } from '../mod.ts';

describe('Bytes', () => {
  it('API', async () => {
    const m = await import('@sys/std/bytes');

    expect(m.Bytes).to.equal(Bytes);
    expect(m.utf8ByteLength).to.equal(utf8ByteLength);
    expect(Bytes.utf8ByteLength).to.equal(utf8ByteLength);
    expect(Object.isFrozen(Bytes)).to.eql(true);
    expectTypeOf(Bytes).toEqualTypeOf<t.Bytes.Lib>();
  });
});
