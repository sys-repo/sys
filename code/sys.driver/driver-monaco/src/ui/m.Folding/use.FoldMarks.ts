import { useEffect, useRef } from 'react';

import { type t, A, Obj, pkg, Pkg } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';
import { clear, fold } from './u.trigger.ts';
import { equalRanges } from './u.ts';

const NAME = Pkg.toString(pkg, 'fold', { version: false });

export const useFoldMarks: t.UseFoldMarks = (args) => {
  const { enabled = true, doc, path } = args;
  const editor = args.editor as t.Monaco.Editor & t.EditorHiddenMembers;

  /**
   * Refs:
   */
  const skipNextPatch = useRef(0);
  const docUpdatingEditor = useRef(false);

  // Current document guards:
  const lastDocId = useRef<t.StringId>(undefined);
  const activeDocId = useRef<t.StringId>(undefined);
  const readyForEditorWrites = useRef(false);

  // Keep refs current on each render:
  activeDocId.current = doc?.id;
  if (lastDocId.current !== doc?.id) {
    readyForEditorWrites.current = false; // new doc → reset gate
    lastDocId.current = doc?.id;
  }

  /**
   * Effects:
   * (Canonical effect dependency vector)
   */
  const effectDeps = [enabled, editor, doc, doc?.id, doc?.instance, Obj.hash(path)];

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
      };
    };

    // Listen to code-fold changes:
    const { $, dispose } = observe(editor);
    $.subscribe((e) => {

      if (activeDocId.current !== doc.id) return; //  ← Old sub firing for a new doc.
      if (!readyForEditorWrites.current) return; //   ← Ignore startup/churn.
      if (docUpdatingEditor.current) return; //       ← Skip echo events from local changes to the document marks in this hook.

      const ranges = toMarkRanges(model, e.areas);
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
  }, effectDeps);

  /**
   * Effect: CRDT ➜ Editor.
   */
  useEffect(() => {
    console.log('Effect: CRDT ➜ Editor.');

    if (!enabled || !editor || !doc || !path?.length) return;
    const model = editor.getModel();
    if (!model) return;

    /**
     * Convert all current "fold" marks to editor folds.
     */
    const applyDocMarksToEditor = () => {
      let rawMarks: Array<{ start: number; end: number; name: string }>;
      try {
        rawMarks = A.marks(doc.current, path);
      } catch (err) {
        return; // NB: (invalidObjectID) / nonexistent path - skip.
      }

      if (model.getValueLength() === 0) return; // Bail until the model is populated.

      // Doc → what we want (offsets):
      const marks = rawMarks.filter((m) => m.name === NAME);
      const nextRanges = marks.map((m) => ({ start: m.start, end: m.end }));

      // Editor → what we have (offsets):
      const hiddenAreas = getHiddenAreas(editor);
      const currentRanges = toMarkRanges(model, hiddenAreas);

      // If already in sync do nothing:
      if (equalRanges(currentRanges, nextRanges)) {
        readyForEditorWrites.current = true;
        return;
      }

      // Decide whether we actually need to unfold-all first.
      const mustClear = hiddenAreas.length > 0;


      // Case A – (no marks):
      if (!marks.length) {
        if (mustClear) {
          docUpdatingEditor.current = true; // ← suppress echo.
          clear(editor);
          docUpdatingEditor.current = false;
        }
        readyForEditorWrites.current = true;
        return;
      }

      // Case B – (marks exist):
      docUpdatingEditor.current = true; // ← suppress echo.
      if (mustClear) clear(editor); //     ← only clear when something is folded.

      marks.forEach((m) => {
        const start = model.getPositionAt(m.start).lineNumber;
        const end = model.getPositionAt(m.end).lineNumber;
        fold(editor, start, end);
      });

      docUpdatingEditor.current = false;
      readyForEditorWrites.current = true;
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
  }, effectDeps);
};
