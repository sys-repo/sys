import { type t, A, Crdt, D, rx, Time, Util } from './common.ts';
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

  if (!enabled || !editor || !doc || !path?.length) return api;

  /**
   * Guards:
   */
  const readyForEditorWrites = { current: false }; // ← editor is seeded and ready to reflect [UI → CRDT]
  const docUpdatingEditor = { current: false }; //    ← suppress echo while applying [CRDT → Editor]
  const skipNextPatch = { current: 0 }; //            ← after [UI → CRDT] write, ignore the next marks patch

  /**
   * Helpers:
   */
  const schedule = Time.scheduler(life, 'micro');
  const readStoredRanges = (): Range[] => {
    try {
      return A.marks(doc.current, path)
        .filter((m) => m.name === D.FOLD_MARK)
        .map(({ start, end }) => ({ start, end }));
    } catch {
      // Repo busy or path missing → treat as no marks.
      return [];
    }
  };

  const writeStoredRanges = async (ranges: Range[]) => {
    // Freeze a snapshot of existing marks to avoid re-reading during the write.
    const prev = readStoredRanges();
    skipNextPatch.current += 1;

    await Crdt.whenIdle(() => {
      doc.change((d) => {
        for (const { start, end } of prev) {
          A.unmark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK);
        }
        for (const { start, end } of ranges) {
          A.mark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK, true);
        }
      });
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
        return; // path missing / unsafe to read right now
      }

      // Defer until we actually have content to fold against.
      if (model.getValueLength() === 0) return;

      const marks = rawMarks.filter((m) => m.name === D.FOLD_MARK);
      const nextRanges = marks.map((m) => ({ start: m.start, end: m.end }));

      const hidden = getHiddenAreas(editor);
      const currentRanges = toMarkRanges(model, hidden);

      if (equalRanges(currentRanges, nextRanges)) {
        // Already matches → we're good to start reflecting editor changes back.
        readyForEditorWrites.current = true;
        return;
      }

      const mustClear = hidden.length > 0;

      if (!marks.length) {
        // No marks → ensure unfolded if needed.
        if (mustClear) {
          docUpdatingEditor.current = true;
          try {
            clear(editor);
          } finally {
            docUpdatingEditor.current = false;
          }
        }
        readyForEditorWrites.current = true;
        return;
      }

      // Apply CRDT marks to the editor.
      docUpdatingEditor.current = true;
      try {
        if (mustClear) clear(editor);
        for (const m of marks) {
          const start = model.getPositionAt(m.start).lineNumber;
          const end = model.getPositionAt(m.end).lineNumber;
          fold(editor, start, end);
        }
      } finally {
        docUpdatingEditor.current = false;
        readyForEditorWrites.current = true;
      }
    };

    const applyFromCRDTWhenIdle = () => Crdt.whenIdle(applyFromCRDT);

    // Seed once from CRDT (idle-safe).
    schedule(applyFromCRDTWhenIdle);

    // If empty at mount, seed again on first content.
    if (model.getValueLength() === 0) {
      const once = model.onDidChangeContent(() => {
        if (model.getValueLength() > 0) {
          schedule(applyFromCRDTWhenIdle);
          once.dispose();
        }
      });
      life.dispose$.subscribe(() => once.dispose());
    }

    /**
     * CRDT → Editor: listen for patches on the text path
     * When marks change (or to be robust, any patch under the path), apply.
     */
    const events = doc.events(life);
    events
      .path(path)
      .$.pipe(rx.takeUntil(life.dispose$))
      .subscribe((e) => {
        // Heuristic: if any patch chunk has a "marks" array, it's a marks patch.
        const hasMarksPatch = e.patches.some((p) => Array.isArray((p as any).marks));
        if (!hasMarksPatch) return;

        if (skipNextPatch.current > 0) {
          skipNextPatch.current -= 1;
          return; // echo of our last write; ignore
        }

        schedule(applyFromCRDTWhenIdle);
      });

    /**
     * Editor → CRDT: observe hidden-areas changes and write marks if they differ.
     */
    const { $ } = observe(editor, life);
    $.pipe(rx.takeUntil(life.dispose$)).subscribe(async (e) => {
      if (!readyForEditorWrites.current) return;
      if (docUpdatingEditor.current) return;

      const ranges = toMarkRanges(model, e.areas);
      const stored = readStoredRanges();
      if (equalRanges(stored, ranges)) return;

      await writeStoredRanges(ranges);
    });
  };

  // Bind to the current or future model.
  const modelNow = editor.getModel();
  if (modelNow) {
    setup(modelNow);
    return api;
  }

  Util.Editor.waitForModel(editor, life).then((model) => {
    if (!model || life.disposed) return;
    setup(model);
  });

  return api;
};
