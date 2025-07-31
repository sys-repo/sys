import { type t, A, AutomergeRepo, c, describe, expect, it } from '../-test.ts';
import { toRef } from './mod.ts';

describe('marks', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('sample: editor code-folding state stored on string', () => {
    /** Range on a sequence that we want to (un)mark. */
    type SequenceRange = {
      start: number;
      end: number;
      /** Automerge requires this for range objects; keep the default. */
      expand?: 'none';
    };

    /**
     * Toggle the `"fold"` mark on the given range.
     *
     * @param d     — *mutable* draft Doc inside `Automerge.change`.
     * @param path  — Path to the **string** or **list** we’re annotating.
     * @param range — Character‐offset range inside that sequence.
     */
    const toggleFoldMark = <T>(d: A.Doc<T>, path: A.Prop[], range: SequenceRange): void => {
      const overlaps = (m: A.Mark): boolean =>
        m.name === 'fold' && !(range.end < m.start || range.start > m.end);
      const alreadyFolded = A.marks(d, path).some(overlaps);

      alreadyFolded ? A.unmark(d, path, range, 'fold') : A.mark(d, path, range, 'fold', true);
    };

    type T = { msg: string };
    const sample = (msg = '') => {
      const repo = new AutomergeRepo();
      const path = ['msg'];
      const handle = repo.create<T>({ msg });
      const doc = toRef(handle);
      return { doc, path, repo } as const;
    };

    it('adds and removes a fold mark', () => {
      const { doc, path } = sample();

      // 1. Insert some text so we have something to annotate:
      doc.change((d) => A.splice(d, path, 0, 0, 'hello world'));
      expect(doc.current.msg).to.eql('hello world');

      const range = { start: 0, end: 5, expand: 'none' } as const;

      // 2. Add the mark:
      doc.change((d) => toggleFoldMark(d, path, range));
      expect(A.marks(doc.current, path)).to.have.length(1);
      expect(A.marks(doc.current, path)[0]).to.eql({
        name: 'fold',
        value: true,
        start: 0,
        end: 5,
      });

      console.info();
      console.info(c.bold(c.cyan('A.marks(doc, path):')), '\n', A.marks(doc.current, path));
      console.info();

      // 3. Toggle again → removes.
      doc.change((d) => toggleFoldMark(d, path, range));
      expect(A.marks(doc.current, path)).to.be.empty;
    });

    it('repositions the mark when text is prepended', () => {
      const { doc, path } = sample();

      // 1. Create some content and mark "world":
      doc.change((d) => A.splice(d, path, 0, 0, 'hello world'));
      expect(doc.current.msg).to.eql('hello world'); // ← sanity check.

      const range = { start: 6, end: 11, expand: 'none' } as const; // “world”
      doc.change((d) => toggleFoldMark(d, path, range));

      let [mark] = A.marks(doc.current, path);
      expect([mark.start, mark.end]).to.eql([6, 11]);

      // 2. Prepend "foo " (length = 4) to the string:
      doc.change((d) => A.splice(d, path, 0, 0, 'foo '));
      expect(doc.current.msg).to.eql('foo hello world'); // ← sanity check.

      mark = A.marks(doc.current, path)[0];
      expect([mark.start, mark.end]).to.eql([10, 15]); // 6 + 4, 11 + 4
    });

    it('events: change fired on writing marks', () => {
      const { doc, path } = sample('foobar');

      const events = doc.events();
      const fired: t.CrdtChange<T>[] = [];
      events.$.subscribe((e) => fired.push(e));

      const range = { start: 0, end: 3, expand: 'none' } as const;
      doc.change((d) => {
        A.mark(d, path, range, 'fold', true);
      });

      const marks = A.marks(doc.current, path);

      expect(fired.length).to.eql(1);
      expect(fired[0].before).to.eql({ msg: 'foobar' });
      expect(fired[0].after).to.eql({ msg: 'foobar' });
      expect(fired[0].patches[0].action).to.eql('mark');
      expect((fired[0].patches[0] as any).marks[0]).to.eql(marks[0]);
      expect((fired[0].patches[0] as any).marks).to.eql([
        { name: 'fold', value: true, start: 0, end: 3 },
      ]);
    });

    /**
     * TODO 🐷 move to Monaco - sample 'toggleFoldMark' to Monaco - proper API:
     */
    describe('edge cases', () => {
      type Doc = { a: string; b?: string };

      const setup = (initial: Partial<Doc> = { a: '' }) => {
        const repo = new AutomergeRepo();
        const handle = repo.create<Doc>({ a: '', ...initial });
        const doc = toRef(handle);
        return { doc, repo } as const;
      };

      /**
       * Overlapping ranges collapse into a single "unmarked" state:
       */
      it('overlapping ranges: second toggle clears first', () => {
        const { doc } = setup({ a: 'abcdef' });
        const path = ['a'] as t.ObjectPath;

        const r1: SequenceRange = { start: 2, end: 4, expand: 'none' }; // "cd"
        const r2: SequenceRange = { start: 1, end: 5, expand: 'none' }; // "bcde"

        doc.change((d) => toggleFoldMark(d, path, r1)); // add first mark
        expect(A.marks(doc.current, path)).to.have.length(1);

        doc.change((d) => toggleFoldMark(d, path, r2)); // overlaps → unmark
        expect(A.marks(doc.current, path)).to.be.empty; // both gone
      });

      /**
       * Independent marks on two different paths don’t interfere:
       */
      it('multi-range document: marks on separate fields remain isolated', () => {
        const { doc } = setup({ a: 'foo', b: 'bar' });
        const pathA = ['a'] as t.ObjectPath;
        const pathB = ['b'] as t.ObjectPath;

        doc.change((d) => toggleFoldMark(d, pathA, { start: 0, end: 3, expand: 'none' }));
        doc.change((d) => toggleFoldMark(d, pathB, { start: 0, end: 3, expand: 'none' }));

        expect(A.marks(doc.current, pathA)).to.have.length(1);
        expect(A.marks(doc.current, pathB)).to.have.length(1);
      });

      /**
       * Attempting to mark an empty string is a no-op (range collapses).
       */
      it('empty string: toggle is a no-op', () => {
        const { doc } = setup(); // a === ''
        const path = ['a'] as t.ObjectPath;

        doc.change((d) => toggleFoldMark(d, path, { start: 0, end: 0, expand: 'none' }));
        expect(A.marks(doc.current, path)).to.be.empty;
      });
    });
  });
});
