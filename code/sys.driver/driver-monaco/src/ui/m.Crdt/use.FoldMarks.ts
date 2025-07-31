import { useEffect, useRef } from 'react';
import { type t, A, EditorFolding, pkg, Pkg } from './common.ts';

type R = { start: number; end: number };

export const useFoldMarks: t.UseFoldMarks = (args) => {
  const { enabled = true, editor, doc, path } = args;
  const NAME = Pkg.toString(pkg, 'fold', { version: false });

  /**
   * Refs:
   */
  const skipNextPatch = useRef(0);
  const editorUpdatingDoc = useRef(false);
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

      editorUpdatingDoc.current = true;
      doc.change((d) => {
        stored.forEach((e) => mark(d, e.start, e.end).unset()); // Wipe existing fold marks.
        ranges.forEach((e) => mark(d, e.start, e.end).set()); //   Write the new set of marks.
      });
      editorUpdatingDoc.current = false;
    });

    return dispose;
  }, [enabled, editor, doc, path]);

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

      const marks = A.marks(doc.current, path).filter((m) => m.name === NAME);
      if (!marks.length) {
        EditorFolding.clear(editor); // Nothing folded in doc → unfold all.
        return;
      }

      docUpdatingEditor.current = true; // ← Suppress echo.
      EditorFolding.clear(editor); //      ← Reset.
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
      if (editorUpdatingDoc.current) return; // Ignore (echo).
      if (!e.patches.some((p) => Array.isArray((p as any).marks))) return;
      applyDocMarksToEditor();
    });

    return events.dispose;
  }, [enabled, editor, doc, path]);
};

/**
 * Helpers:
 */
function equalRanges(a: R[], b: R[]) {
  if (a.length !== b.length) return false;
  const sort = (xs: typeof a) => [...xs].sort((p, q) => p.start - p.start || p.end - q.end);
  const aa = sort(a),
    bb = sort(b);
  return aa.every((r, i) => r.start === bb[i].start && r.end === bb[i].end);
}
