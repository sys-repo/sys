import { Immutable } from '../../../m.rfc6902/mod.ts';
import { describe, expect, it } from '../../../-test.ts';

describe('Immutable.Is', () => {
  type D = { count: number; list?: number[] };

  const { Is } = Immutable;
  const NON = [123, 'abc', [], {}, undefined, null, true, Symbol('foo'), BigInt(0)];

  it('Is.immutable', () => {
    NON.forEach((v) => expect(Is.immutable(v)).to.eql(false));
    const imm = Immutable.cloner<D>({ count: 1 });
    expect(Is.immutable(imm)).to.eql(true);
    expect(Is.immutable({ current: { count: 1 } })).to.eql(false); // shape-only
  });

  it('Is.immutableRef', () => {
    NON.forEach((v) => expect(Is.immutableRef(v)).to.eql(false));
    const imm = Immutable.cloner<D>({ count: 1 });
    const ref = Immutable.clonerRef<D>({ count: 1 });
    expect(Is.immutableRef(imm)).to.eql(false);
    expect(Is.immutableRef(ref)).to.eql(true);
  });

  it('Is.readonlyImmutable', () => {
    NON.forEach((v) => expect(Is.readonlyImmutable(v)).to.eql(false));
    const imm = Immutable.cloner<D>({ count: 1 });
    const view = { current: imm.current };
    expect(Is.readonlyImmutable(view)).to.eql(true);
    expect(Is.readonlyImmutable(imm)).to.eql(true); // also valid
  });

  it('Is.readonlyImmutableRef', () => {
    NON.forEach((v) => expect(Is.readonlyImmutableRef(v)).to.eql(false));
    const ref = Immutable.clonerRef<D>({ count: 1 });
    const ro = { instance: ref.instance, events: ref.events, current: ref.current };
    expect(Is.readonlyImmutableRef(ref)).to.eql(true);
    expect(Is.readonlyImmutableRef(ro)).to.eql(true);
  });

  it('Is.proxy', () => {
    NON.forEach((v) => expect(Is.proxy(v)).to.eql(false));
    const doc = Immutable.clonerRef<D>({ count: 1, list: [1, 2] });
    const proxy = doc.current;
    expect(Is.proxy(proxy)).to.eql(true);
    expect(Is.proxy(doc)).to.eql(false);
  });
});
