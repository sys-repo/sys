import { useEffect, useRef } from 'react';
import { type t, Obj, A, EditorFolding, pkg, Pkg } from './common.ts';

type R = { start: number; end: number };
const NAME = Pkg.toString(pkg, 'fold', { version: false });

export const useFoldMarks: t.UseFoldMarks = (args) => {
  const { enabled = true, doc, path } = args;
  const editor = args.editor as t.Monaco.Editor & t.EditorHiddenMembers;

  /**
   * Refs:
   */
  const skipNextPatch = useRef(0);
  const docUpdatingEditor = useRef(false);

  /**
   * Effect: Editor ➜ CRDT.
   */
  useEffect(() => {
    if (!enabled || !editor || !doc || !path?.length) return;
    const model = editor.getModel();
    if (!model) return;

    const mark = (d: A.Doc<unknown>, start: t.Index, end: t.Index) => {
      const range: t.Crdt.Mark.Range = { start, end, expand: 'none' };
      return {
        set: () => A.mark(d, path, range, NAME, true),
        unset: () => A.unmark(d, path, range, NAME),
      } as const;
    };

    // Listen to code-fold changes:
    const { $, dispose } = EditorFolding.observe(editor);
    $.subscribe((e) => {
      if (docUpdatingEditor.current) return; // Skip echo events from local changes to the document marks in this hook.

      const ranges = EditorFolding.toMarkRanges(model, e.areas);
      const stored = A.marks(doc.current, path)
        .filter((m) => m.name === NAME)
        .map(({ start, end }) => ({ start, end }));

      if (equalRanges(stored, ranges)) return; // No diff → skip write.

      skipNextPatch.current += 1;
      doc.change((d) => {
        stored.forEach((e) => mark(d, e.start, e.end).unset()); // ← Wipe existing fold marks.
        ranges.forEach((e) => mark(d, e.start, e.end).set()); //   ← Write the new set of marks.
      });
    });

    return dispose;
  }, [enabled, editor, doc, Obj.hash(path)]);

  /**
   * Effect: CRDT ➜ Editor.
   */
  useEffect(() => {
    if (!enabled || !editor || !doc || !path?.length) return;
    const model = editor.getModel();
    if (!model) return;

    /**
     * Convert all current "fold" marks to editor folds.
     */
    const applyDocMarksToEditor = () => {
      if (model.getValueLength() === 0) return; // Bail until the model is populated.

      // Doc → ranges we "want":
      const marks = A.marks(doc.current, path).filter((m) => m.name === NAME);
      const nextRanges = marks.map((m) => ({
        start: model.getPositionAt(m.start).lineNumber,
        end: model.getPositionAt(m.end).lineNumber,
      }));

      // Editor → ranges we "have":
      const hiddenAreas = EditorFolding.getHiddenAreas(editor);
      const currentRanges = EditorFolding.toMarkRanges(model, hiddenAreas);

      // Already in sync?  Nothing to do.
      if (equalRanges(currentRanges, nextRanges)) return;

      // Decide whether we actually need to unfold-all first.
      const mustClear = hiddenAreas.length > 0;

      // Case A – the document says "no folds":
      if (!marks.length) {
        if (mustClear) EditorFolding.clear(editor); // unfold once, only if needed
        return;
      }

      // Case B – we have folds to apply:
      docUpdatingEditor.current = true; //            suppress echo.
      if (mustClear) EditorFolding.clear(editor); // only clear when something is folded

      marks.forEach((m) => {
        const start = model.getPositionAt(m.start).lineNumber;
        const end = model.getPositionAt(m.end).lineNumber;
        EditorFolding.fold(editor, start, end);
      });

      docUpdatingEditor.current = false;
    };

    // Seed editor with current marks:
    applyDocMarksToEditor();
    if (model.getValueLength() === 0) {
      // The model is not yet loaded - await it's content.
      const once = model.onDidChangeContent(() => {
        if (model.getValueLength() > 0) {
          applyDocMarksToEditor();
          once.dispose(); // Detach handler once initialized.
        }
      });
    }

    // Listen for future mark/unmark patches:
    const events = doc.events();
    events.path(path).$.subscribe((e) => {
      if (skipNextPatch.current > 0) {
        skipNextPatch.current -= 1;
        return; // This is our own local change — ignore once.
      }
      if (!e.patches.some((p) => Array.isArray((p as any).marks))) return;
      applyDocMarksToEditor();
    });

    return events.dispose;
  }, [enabled, editor, doc, Obj.hash(path)]);
};
