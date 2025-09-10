import { type t, A, D, rx, Util } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';
import { clear, fold } from './u.trigger.ts';
import { equalRanges } from './u.ts';

type Range = { start: number; end: number };

/**
 * Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free).
 */
export const bindFoldMarks: t.BindFoldMarks = (args) => {
  const { editor, doc, path, enabled = true, until } = args;
  const life = rx.lifecycle(until);
  const api = life;

  if (!enabled || !editor || !doc || !path?.length) {
    return api;
  }

  /**
   * Guards shared by both directions:
   */
  const readyForEditorWrites = { current: false };
  const docUpdatingEditor = { current: false }; //  ← suppress E → C echoes during editor-driven changes
  const skipNextPatch = { current: 0 }; //          ← ignore next C → E mark patch after E→C write

  /**
   * Helpers:
   */
  const readStoredRanges = (): Range[] => {
    try {
      return A.marks(doc.current, path)
        .filter((m) => m.name === D.FOLD_MARK)
        .map(({ start, end }) => ({ start, end }));
    } catch {
      return [];
    }
  };

  const writeStoredRanges = (ranges: Range[]) => {
    skipNextPatch.current += 1;
    doc.change((d) => {
      for (const { start, end } of readStoredRanges()) {
        A.unmark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK);
      }
      for (const { start, end } of ranges) {
        A.mark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK, true);
      }
    });
  };

  /**
   * Main:
   */
  const setup = (model: t.Monaco.TextModel) => {
    const applyFromCRDT = () => {
      let rawMarks: Array<{ start: number; end: number; name: string }>;
      try {
        rawMarks = A.marks(doc.current, path);
      } catch {
        return; // path missing/invalid
      }

      if (model.getValueLength() === 0) return; // wait for content

      const marks = rawMarks.filter((m) => m.name === D.FOLD_MARK);
      const nextRanges = marks.map((m) => ({ start: m.start, end: m.end }));

      const hidden = getHiddenAreas(editor);
      const currentRanges = toMarkRanges(model, hidden);

      if (equalRanges(currentRanges, nextRanges)) {
        readyForEditorWrites.current = true;
        return;
      }

      const mustClear = hidden.length > 0;

      if (!marks.length) {
        if (mustClear) {
          docUpdatingEditor.current = true;
          clear(editor);
          docUpdatingEditor.current = false;
        }
        readyForEditorWrites.current = true;
        return;
      }

      docUpdatingEditor.current = true;
      if (mustClear) clear(editor);
      for (const m of marks) {
        const start = model.getPositionAt(m.start).lineNumber;
        const end = model.getPositionAt(m.end).lineNumber;
        fold(editor, start, end);
      }
      docUpdatingEditor.current = false;
      readyForEditorWrites.current = true;
    };

    // Seed from CRDT
    applyFromCRDT();
    if (model.getValueLength() === 0) {
      const once = model.onDidChangeContent(() => {
        if (model.getValueLength() > 0) {
          applyFromCRDT();
          once.dispose();
        }
      });
      life.dispose$.subscribe(() => once.dispose());
    }

    // CRDT → Editor:
    const events = doc.events();
    const crdtSub = events.path(path).$.subscribe((e) => {
      const hasMarksPatch = e.patches.some((p) => Array.isArray((p as any).marks));
      if (!hasMarksPatch) return;
      if (skipNextPatch.current > 0) {
        skipNextPatch.current -= 1;
        return;
      }
      applyFromCRDT();
    });

    // Editor → CRDT:
    const { $, dispose: disposeObserve } = observe(editor);
    const editorSub = $.subscribe((e) => {
      if (!readyForEditorWrites.current) return;
      if (docUpdatingEditor.current) return;

      const ranges = toMarkRanges(model, e.areas);
      const stored = readStoredRanges();
      if (equalRanges(stored, ranges)) return;

      writeStoredRanges(ranges);
    });

    // Cleanup:
    life.dispose$.subscribe(() => {
      crdtSub.unsubscribe?.();
      events.dispose?.();
      editorSub.unsubscribe?.();
      disposeObserve();
    });
  };

  // Try immediately...
  const modelNow = editor.getModel();
  if (modelNow) {
    setup(modelNow);
    return api;
  }

  // ...otherwise wait until a model attaches (or the lifecycle is disposed).
  Util.Editor.waitForModel(editor, life).then((model) => {
    if (!model || life.disposed) return;
    setup(model);
  });

  return api;
};
