import { type t, describe, expect, it, MonacoFake, rx, Time } from '../../-test.ts';
import { EditorFolding } from './mod.ts';
import { bindFoldMarks } from './u.bind.ts';
import { useFoldMarks } from './use.FoldMarks.ts';

describe('Monaco.Folding', () => {
  it('API', () => {
    expect(EditorFolding.useFoldMarks).to.equal(useFoldMarks);
    expect(EditorFolding.bindFoldMarks).to.equal(bindFoldMarks);
  });

  describe('Folding.observe', () => {
    it('create', () => {
      const editor = MonacoFake.editor('');
      const ob = EditorFolding.observe(editor);
      expect(ob.areas).to.eql([]);
    });

    describe('lifecycle', () => {
      it('dispose: via method', () => {
        const editor = MonacoFake.editor('');
        const ob = EditorFolding.observe(editor);
        expect(ob.disposed).to.eql(false);
        ob.dispose();
        expect(ob.disposed).to.eql(true);
      });

      it('dispose: via dispose$', () => {
        const life = rx.disposable();
        const editor = MonacoFake.editor('');
        const ob = EditorFolding.observe(editor, life);
        expect(ob.disposed).to.eql(false);
        life.dispose();
        expect(ob.disposed).to.eql(true);
      });
    });

    describe('observer updates', () => {
      it('observer reflects fold/unfold events', async () => {
        const src = 'line one\nline two\nline three';
        const editor = MonacoFake.editor(src);
        const ob = EditorFolding.observe(editor);

        const fired: t.EditorFoldingAreaChange[] = [];
        ob.$.subscribe((e) => fired.push(e));

        const fold: t.Monaco.I.IRange = {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 1,
        };

        // Fold lines 2-3:
        editor.setHiddenAreas([fold]);
        await Time.wait(10);
        expect(ob.areas).to.eql([fold]);
        expect(fired.length).to.eql(1);
        expect(fired.at(-1)?.areas).to.eql([fold]);

        // Unfold everything:
        editor.setHiddenAreas([]);
        await Time.wait(10);
        expect(ob.areas).to.eql([]);

        expect(fired.length).to.eql(2);
        expect(fired.at(-1)?.areas).to.eql([]);
      });

      it('observer stops updating after dispose', () => {
        const editor = MonacoFake.editor('one\ntwo');
        const ob = EditorFolding.observe(editor);

        ob.dispose();

        const fold: t.Monaco.I.IRange = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 1,
        };

        editor.setHiddenAreas([fold]);
        expect(ob.areas).to.eql([]); // Value stays frozen because observer has been disposed.
      });
    });
  });

  describe('Folding.fold', () => {
    it('updates observer when a range is folded', () => {
      const src = 'a\nb\nc\nd';
      const editor = MonacoFake.editor(src);
      const ob = EditorFolding.observe(editor);

      // Initial state → no folds:
      expect(ob.areas).to.eql([]);

      // Fold lines 2-3 (inclusive):
      EditorFolding.fold(editor, 2, 3);

      expect(ob.areas).to.eql([
        {
          startLineNumber: 2,
          startColumn: 1,
          endLineNumber: 3,
          endColumn: 1,
        },
      ]);
    });

    it('no further updates after observer is disposed', () => {
      const editor = MonacoFake.editor('x\ny');
      const ob = EditorFolding.observe(editor);
      ob.dispose();

      EditorFolding.fold(editor, 1); // ← would fold line 1.
      expect(ob.areas).to.eql([]); //  ← still empty → not updated.
    });
  });

  describe('Folding.unfold', () => {
    it('unfolding a line inside a folded block reveals the whole block', () => {
      const src = 'a\nb\nc\nd\ne';
      const editor = MonacoFake.editor(src);

      // Fold lines 2-4 → one contiguous hidden block:
      EditorFolding.fold(editor, 2, 4);
      expect(editor.getHiddenAreas()).to.eql([
        { startLineNumber: 2, startColumn: 1, endLineNumber: 4, endColumn: 1 },
      ]);

      // Unfold any line within that block (line 3 here) → entire block opens:
      EditorFolding.unfold(editor, 3);
      expect(editor.getHiddenAreas()).to.eql([]);
    });
  });

  describe('Folding.clear', () => {
    it('wipes the editors hidden-area list', () => {
      const editor = MonacoFake.editor('a\nb\nc');
      EditorFolding.fold(editor, 2); //          ← hide "b".
      expect(editor.getHiddenAreas()).to.have.length(1);

      EditorFolding.clear(editor); //            ← reveal everything.
      expect(editor.getHiddenAreas()).to.eql([]);
    });

    it('notifies live observers', () => {
      const editor = MonacoFake.editor('x\ny\nz');
      const ob = EditorFolding.observe(editor);

      EditorFolding.fold(editor, 2, 3); //  ← hide "y", "z".
      expect(ob.areas).to.have.length(1);

      EditorFolding.clear(editor); //            ← clear folds.
      expect(ob.areas).to.eql([]);
    });
  });

  describe('Folding.toMarkRanges', () => {
    /**
     * Utility: fold a range, run the converter, return the first SequenceRange.
     */
    const seq = (src: string, fold: [number, number]) => {
      const editor = MonacoFake.editor(src);
      EditorFolding.fold(editor, ...fold); // ← programmatic fold.
      const model = editor.getModel()!;
      const areas = editor.getHiddenAreas();
      return EditorFolding.toMarkRanges(model, areas)[0];
    };

    it('converts a mid-file fold (lines 2-3)', () => {
      const range = seq('a\nb\nc\nd', [2, 3]);

      // Expected offsets (derived from the same model → no hard-coded numbers).
      const editor = MonacoFake.editor('a\nb\nc\nd');
      const model = editor.getModel()!;
      const exp = {
        start: model.getOffsetAt({ lineNumber: 1, column: 1 }),
        end: model.getOffsetAt({ lineNumber: 4, column: 1 }) - 1,
        expand: 'none',
      };

      expect(range).to.eql(exp);
    });

    it('folding the last line computes "end" with lineMaxColumn', () => {
      const text = 'foo\nbar';
      const range = seq(text, [2, 2]);

      const editor = MonacoFake.editor(text);
      const model = editor.getModel()!;
      const endOffset =
        model.getOffsetAt({
          lineNumber: 2,
          column: model.getLineMaxColumn(2),
        }) - 1;

      expect(range.end).to.eql(endOffset);
    });
  });
});
