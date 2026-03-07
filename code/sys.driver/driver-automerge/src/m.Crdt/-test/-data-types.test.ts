import { Crdt } from '../../-exports/-fs/mod.ts';
import { describe, expect, it, Obj } from '../../-test.ts';

/**
 * REF:
 * - https://automerge.org/docs/reference/documents/
 */
describe('CRDT: Data Types (Automerge)', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('text:', () => {
    type T = { foo?: { bar?: { text?: string | null } } };
    const path = ['foo', 'bar', 'text'];
    const repo = Crdt.repo();

    it('assign text (deep)', async () => {
      const { doc, error } = await repo.create<T>({});
      if (error) throw error;

      const path = ['foo', 'bar', 'text'];
      expect(doc.current.foo?.bar?.text).to.eql(undefined);

      doc.change((d) => Obj.Path.Mutate.set(d, path, 'hello'));
      expect(doc.current.foo?.bar?.text).to.eql('hello');
    });

    it('ensure: "text" (deep)', async () => {
      const { doc, error } = await repo.create<T>({});
      if (error) throw error;

      expect(doc.current.foo?.bar?.text).to.eql(undefined);
      doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));
      expect(doc.current.foo?.bar?.text).to.eql('');

      doc.change((d) => Obj.Path.Mutate.ensure(d, path, 'Hello Change'));
      expect(doc.current.foo?.bar?.text).to.eql(''); // NB: already set to "".
    });

    it('ensure: null (deep)', async () => {
      const { doc, error } = await repo.create<T>({});
      if (error) throw error;

      doc.change((d) => Obj.Path.Mutate.ensure(d, path, null));
      expect(doc.current.foo?.bar?.text).to.eql(null);

      doc.change((d) => Obj.Path.Mutate.ensure(d, path, 'Hello Change'));
      expect(doc.current.foo?.bar?.text).to.eql(null); // ← already set to <null>.

      doc.change((d) => Obj.Path.Mutate.set(d, path, 'Yolo 👋'));
      expect(doc.current.foo?.bar?.text).to.eql('Yolo 👋'); // ← actual change.
    });
  });
});
