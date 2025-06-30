import { describe, expect, it, Obj } from '../../-test.ts';
import { Crdt } from '../../-platforms/-fs/mod.ts';

/**
 * REF:
 * - https://automerge.org/docs/reference/documents/
 */
describe(
  'CRDT: Data Structures (Automerge)',
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    describe('text:', () => {
      type T = { foo?: { bar?: { text?: string | null } } };
      const path = ['foo', 'bar', 'text'];
      const repo = Crdt.repo();

      it('assign text (deep)', () => {
        const doc = repo.create<T>({});
        const path = ['foo', 'bar', 'text'];
        expect(doc.current.foo?.bar?.text).to.eql(undefined);

        doc.change((d) => Obj.Path.Mutate.set(d, path, 'hello'));
        expect(doc.current.foo?.bar?.text).to.eql('hello');
      });

      it('ensure: "text" (deep)', () => {
        const doc = repo.create<T>({});

        expect(doc.current.foo?.bar?.text).to.eql(undefined);
        doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));
        expect(doc.current.foo?.bar?.text).to.eql('');

        doc.change((d) => Obj.Path.Mutate.ensure(d, path, 'Hello Change'));
        expect(doc.current.foo?.bar?.text).to.eql(''); // NB: already set to "".
      });

      it('ensure: null (deep)', () => {
        const doc = repo.create<T>({});

        doc.change((d) => Obj.Path.Mutate.ensure(d, path, null));
        expect(doc.current.foo?.bar?.text).to.eql(null);

        doc.change((d) => Obj.Path.Mutate.ensure(d, path, 'Hello Change'));
        expect(doc.current.foo?.bar?.text).to.eql(null); // ← already set to <null>.

        doc.change((d) => Obj.Path.Mutate.set(d, path, 'Yolo 👋'));
        expect(doc.current.foo?.bar?.text).to.eql('Yolo 👋'); // ← actual change.
      });
    });
  },
);
