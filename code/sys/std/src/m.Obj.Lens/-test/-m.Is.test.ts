import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Lens } from '../mod.ts';

describe('Obj.Lens.Is', () => {
  it('lens: unbound builder', () => {
    const unbound = Lens.at('/a/b'); // ObjLens (unbound)
    expect(Lens.Is.lens(unbound)).to.eql(true);
    expect(Lens.Is.lensRef(unbound)).to.eql(false);
    expect(Lens.Is.lensRefReadonly(unbound)).to.eql(false);
    expect(Lens.Is.lensRefWritable(unbound)).to.eql(false);
    expect(Lens.Is.readonly(unbound)).to.eql(false);

    // type narrowing
    if (Lens.Is.lens(unbound)) {
      expectTypeOf(unbound).toMatchTypeOf<t.ObjLens<unknown>>();
    }
  });

  it('lensRef: bound writable lens', () => {
    const subject = { a: { b: 123 } };
    const rwRoot = Lens.bind(subject); // writable root
    const rw = rwRoot.at('/a/b');

    expect(Lens.Is.lens(rw)).to.eql(false);
    expect(Lens.Is.lensRef(rw)).to.eql(true);
    expect(Lens.Is.lensRefWritable(rw)).to.eql(true);
    expect(Lens.Is.lensRefReadonly(rw)).to.eql(false);
    expect(Lens.Is.readonly(rw)).to.eql(false);

    // type narrowing
    if (Lens.Is.lensRefWritable(rw)) {
      expectTypeOf(rw).toMatchTypeOf<t.ObjLensRef<typeof subject, unknown>>();
    }
  });

  it('lensRef: bound read-only lens', () => {
    const subject = { a: { b: 123 } };
    const roRoot = Lens.Readonly.bind(subject); // read-only root
    const ro = roRoot.at('/a/b');

    expect(Lens.Is.lens(ro)).to.eql(false);
    expect(Lens.Is.lensRef(ro)).to.eql(true);
    expect(Lens.Is.lensRefReadonly(ro)).to.eql(true);
    expect(Lens.Is.lensRefWritable(ro)).to.eql(false);
    expect(Lens.Is.readonly(ro)).to.eql(true);

    // type narrowing
    if (Lens.Is.lensRefReadonly(ro)) {
      expectTypeOf(ro).toMatchTypeOf<t.ReadonlyObjLensRef<typeof subject, unknown>>();
    }
  });

  it('negative cases', () => {
    const cases: any[] = [
      undefined,
      null,
      0,
      1.5,
      NaN,
      Infinity,
      '',
      'a',
      true,
      false,
      {},
      { subject: {}, path: ['a', 0] }, // missing get/exists/at
      { get: () => 1, exists: () => true, at: () => null }, // missing subject/path
      [],
      ['/not', 'a', 'lens'],
      () => {},
    ];

    for (const v of cases) {
      expect(Lens.Is.lens(v)).to.eql(false);
      expect(Lens.Is.lensRef(v)).to.eql(false);
      expect(Lens.Is.lensRefReadonly(v)).to.eql(false);
      expect(Lens.Is.lensRefWritable(v)).to.eql(false);
      expect(Lens.Is.readonly(v)).to.eql(false);
    }
  });

  it('structural: bound lens has subject and path that are stable', () => {
    const subject = { x: { y: { z: 1 } } };
    const rw = Lens.bind(subject).at('/x/y/z');
    const ro = Lens.Readonly.bind(subject).at('/x/y/z');

    // ensure structural presence the guard relies on (sanity)
    expect('subject' in (rw as any)).to.eql(true);
    expect('path' in (rw as any)).to.eql(true);
    expect(Array.isArray((rw as any).path)).to.eql(true);

    expect('subject' in (ro as any)).to.eql(true);
    expect('path' in (ro as any)).to.eql(true);
    expect(Array.isArray((ro as any).path)).to.eql(true);
  });
});
