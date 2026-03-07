import { Immutable } from '../../../m.rfc6902/mod.ts';
import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { asReadonly } from '../mod.ts';

describe('asReadonly', () => {
  type Foo = { msg: string };
  type Patch = t.Rfc6902PatchOperation;

  it('returns a readonly ref from a mutable ref', () => {
    const ref = Immutable.clonerRef<Foo>({ msg: 'hello' });
    const ro = asReadonly(ref);

    // type-level
    expectTypeOf(ro).toEqualTypeOf<
      t.ImmutableRefReadonly<Foo, Patch, t.ImmutableEvents<Foo, Patch>>
    >();

    // runtime
    expect(ro.current.msg).to.equal('hello');
    expect(ro).to.have.property('instance');
    expect(ro).to.have.property('events');
    expect(() => (ro as any).change(() => {})).to.throw(); // mutation blocked
  });

  it('returns a readonly ref from a plain immutable', () => {
    const doc = Immutable.cloner<Foo>({ msg: 'hi' });
    const ro = asReadonly(doc);

    // type-level
    expectTypeOf(ro).toEqualTypeOf<
      t.ImmutableRefReadonly<Foo, Patch, t.ImmutableEvents<Foo, Patch>>
    >();

    // runtime
    expect(ro.current.msg).to.equal('hi');
    expect(() => (ro as any).change(() => {})).to.throw();
  });

  it('is idempotent on already readonly input', () => {
    const ref = Immutable.clonerRef<Foo>({ msg: 'hey' });
    const readonlyRef = asReadonly(ref);
    const result = asReadonly(readonlyRef);

    // type-level
    expectTypeOf(result).toEqualTypeOf<
      t.ImmutableRefReadonly<Foo, Patch, t.ImmutableEvents<Foo, Patch>>
    >();

    // runtime
    expect(result.current.msg).to.equal('hey');
  });

  it('throws on objects without events() implementation', () => {
    const fake: any = { current: { foo: 1 } };
    const ro = asReadonly(fake);
    expect(() => ro.events()).to.throw('events() not implemented on readonly view');
  });

  it('preserves instance across asReadonly calls (idempotent identity)', () => {
    const ref = Immutable.clonerRef<Foo>({ msg: 'id' });
    const ro1 = asReadonly(ref);
    const ro2 = asReadonly(ro1);
    expect(ro1.instance).to.equal(ref.instance);
    expect(ro2.instance).to.equal(ref.instance);
  });

  it('plain immutable → readonly ref has events() that throws (no events source)', () => {
    const doc = Immutable.cloner<Foo>({ msg: 'no-events' });
    const ro = asReadonly(doc);
    expect(() => ro.events()).to.throw('events() not implemented on readonly view');
  });
});
