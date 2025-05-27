import { DEFAULTS, Doc } from './mod.ts';
import { describe, expect, it, type t } from '../../-test.ts';

describe('Doc.Meta', () => {
  it('standard key', () => {
    expect(Doc.Meta.key).to.eql('.meta');
  });

  it('standard defaults', () => {
    expect(Doc.Meta.default).to.eql(DEFAULTS.initial.meta);
    expect(Doc.Meta.default).to.not.equal(Doc.Meta.default); // NB: cloned instance.
  });

  it('ensure: mutates input document', () => {
    const doc = { count: 123 } as any;
    const initial: t.DocMeta = { ephemeral: true };
    expect(Doc.Meta.exists(doc)).to.eql(false);

    const res = Doc.Meta.ensure(doc, initial);
    expect(res).to.eql(true);
    expect(doc[Doc.Meta.key]).to.eql(initial);
    expect(Doc.Meta.exists(doc)).to.eql(true);
  });

  it('get: does not have .meta → undefined (invalid input)', () => {
    [null, undefined, '', 123, true, [], {}].forEach((doc: any) => {
      expect(Doc.Meta.get(doc)).to.eql(undefined);
      expect(Doc.Meta.exists(doc)).to.eql(false);
    });
  });

  it('get: does NOT mutate the input document (default)', () => {
    const doc = { count: 123 };
    const res = Doc.Meta.get(doc);
    expect(res).to.eql(undefined);
    expect(doc).to.eql(doc);
    expect((doc as any)[Doc.Meta.key]).to.eql(undefined);
    expect(Doc.Meta.exists(doc)).to.eql(false);
  });

  it('get: does mutate the input document ← { mutate: true }', () => {
    const doc = { count: 123 };
    const res = Doc.Meta.get(doc, { mutate: true });
    expect(res).to.eql(DEFAULTS.initial.meta);
    expect((doc as any)[Doc.Meta.key]).to.eql({});
    expect(Doc.Meta.exists(doc)).to.eql(true);
  });

  it('get: metadata <Type> extension', () => {
    type T = t.DocMeta & { foo: number };
    const initial: T = { foo: 123, ephemeral: true, type: { name: 'foo.bar' } };
    const doc = { message: 'hello' };
    const res = Doc.Meta.get(doc, { mutate: true, initial });
    expect(res).to.eql(initial);
    expect((doc as any)[Doc.Meta.key]).to.eql(initial);
    expect(res.type?.name).to.eql('foo.bar');
    expect(res.ephemeral).to.eql(true);
    expect(res.foo).to.eql(123);
  });
});
