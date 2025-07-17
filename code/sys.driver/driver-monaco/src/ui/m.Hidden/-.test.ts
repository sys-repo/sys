import { type t, describe, expect, it, MonacoFake, rx } from '../../-test.ts';
import { EditorHidden } from './mod.ts';

describe('Monaco.Hidden', () => {
  describe('code folding', () => {
    describe('Monaco.Hidden.observeAreas', () => {
      it('create', () => {
        const editor = MonacoFake.editor('');
        const ob = EditorHidden.observeAreas(editor);
        expect(ob.areas).to.eql([]);
      });

      describe('lifecycle', () => {
        it('dispose: via method', () => {
          const editor = MonacoFake.editor('');
          const ob = EditorHidden.observeAreas(editor);
          expect(ob.disposed).to.eql(false);
          ob.dispose();
          expect(ob.disposed).to.eql(true);
        });

        it('dispose: via dispose$', () => {
          const life = rx.disposable();
          const editor = MonacoFake.editor('');
          const ob = EditorHidden.observeAreas(editor, life);
          expect(ob.disposed).to.eql(false);
          life.dispose();
          expect(ob.disposed).to.eql(true);
        });
      });

      describe('observer updates', () => {
        it('observer reflects fold/unfold events', () => {
          const src = 'line one\nline two\nline three';
          const editor = MonacoFake.editor(src);
          const ob = EditorHidden.observeAreas(editor);

          const fired: t.EditorHiddenAreaChange[] = [];
          ob.$.subscribe((e) => fired.push(e));

          const fold: t.Monaco.IRange = {
            startLineNumber: 2,
            startColumn: 1,
            endLineNumber: 3,
            endColumn: 1,
          };

          // Fold lines 2-3:
          editor.setHiddenAreas([fold]);
          expect(ob.areas).to.eql([fold]);

          expect(fired.length).to.eql(1);
          expect(fired.at(-1)?.areas).to.eql([fold]);

          // Unfold everything:
          editor.setHiddenAreas([]);
          expect(ob.areas).to.eql([]);

          expect(fired.length).to.eql(2);
          expect(fired.at(-1)?.areas).to.eql([]);
        });

        it('observer stops updating after dispose', () => {
          const editor = MonacoFake.editor('one\ntwo');
          const ob = EditorHidden.observeAreas(editor);

          ob.dispose();

          const fold: t.Monaco.IRange = {
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

    describe('Monaco.Hidden.foldRange', () => {
      it('updates observeAreas when a range is folded', () => {
        const src = 'a\nb\nc\nd';
        const editor = MonacoFake.editor(src);
        const ob = EditorHidden.observeAreas(editor);

        // Initial state → no folds:
        expect(ob.areas).to.eql([]);

        // Fold lines 2-3 (inclusive):
        EditorHidden.foldRange(editor, 2, 3);

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
        const ob = EditorHidden.observeAreas(editor);
        ob.dispose();

        EditorHidden.foldRange(editor, 1); // ← would fold line 1.
        expect(ob.areas).to.eql([]); //       ← still empty → not updated.
      });
    });

    describe('Monaco.Hidden.clear', () => {
      it('wipes the editors hidden-area list', () => {
        const editor = MonacoFake.editor('a\nb\nc');
        EditorHidden.foldRange(editor, 2); //          ← hide "b".
        expect(editor.getHiddenAreas()).to.have.length(1);

        EditorHidden.clear(editor); //                 ← reveal everything.
        expect(editor.getHiddenAreas()).to.eql([]);
      });

      it('notifies live observers', () => {
        const editor = MonacoFake.editor('x\ny\nz');
        const ob = EditorHidden.observeAreas(editor);

        EditorHidden.foldRange(editor, 2, 3); //  ← hide "y", "z".
        expect(ob.areas).to.have.length(1);

        EditorHidden.clear(editor); //            ← clear folds.
        expect(ob.areas).to.eql([]);
      });
    });
  });
});
