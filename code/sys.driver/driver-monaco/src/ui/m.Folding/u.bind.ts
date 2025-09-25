import { type t, A, Bus, D, RangeUtil, rx, Schedule, Util } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';
import { clear, fold } from './u.trigger.ts';

type IRange = t.Monaco.I.IRange;

/**
 * Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free).
 */
export const bindFoldMarks: t.BindFoldMarks = (args) => {
  const { editor, doc, path, until, enabled = true } = args;
  const life = rx.lifecycle(until);
  const schedule = Schedule.make(life, 'micro');

  /**
   * Events:
   */
  const bus$ = args.bus$ ?? Bus.make();
  const $ = bus$.pipe(
    rx.takeUntil(life.dispose$),
    rx.filter((e) => e.kind === 'marks'),
  );
  const api = rx.toLifecycle<t.EditorFoldBinding>(life, { $ });

  if (!enabled || !editor || !doc || !path?.length) return api;

  /**
   * Guards:
   */
  const readyForEditorWrites = { current: false }; // ← editor is seeded and ready to reflect [UI → CRDT]
  const docUpdatingEditor = { current: false }; //    ← suppress echo while applying [CRDT → Editor]
  const skipNextPatch = { current: 0 }; //            ← after [UI → CRDT] write, ignore the next marks patch

  /**
   * Main:
   */
  const setup = (model: t.Monaco.TextModel) => {
    const readyOnce = { current: false }; // add near the other guards

    const emitReadyOnce = () => {
      if (readyOnce.current) return;
      readyOnce.current = true;
      // Bus.emit(bus$, { kind: 'marks:ready', path });
      console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🫵 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
    };

    /**
     * Helpers (IRange ←→ offset conversions live here to access the model):
     */
    const offsetsToRanges = (offsets: readonly { start: number; end: number }[]): IRange[] =>
      offsets.map(({ start, end }) => {
        const s = model.getPositionAt(start);
        const e = model.getPositionAt(end);
        return RangeUtil.fromPosition(s, e);
      });

    const rangesToOffsets = (ranges: readonly IRange[]) =>
      ranges.map((r) => ({
        start: model.getOffsetAt({ lineNumber: r.startLineNumber, column: r.startColumn }),
        end: model.getOffsetAt({ lineNumber: r.endLineNumber, column: r.endColumn }),
      }));

    const readStoredRanges = (): IRange[] => {
      try {
        const marks = A.marks(doc.current, path).filter((m) => m.name === D.FOLD_MARK);
        return offsetsToRanges(marks.map(({ start, end }) => ({ start, end })));
      } catch {
        return [];
      }
    };

    const fire = (trigger: t.EventMarks['trigger'], before: IRange[], after: IRange[]) => {
      if (RangeUtil.eql(before, after)) return;
      Bus.emit(bus$, {
        kind: 'marks',
        trigger,
        path,
        change: { before, after },
      });
    };

    const writeStoredRanges = async (ranges: IRange[]) => {
      const stored = readStoredRanges();
      const prev = rangesToOffsets(stored);
      const next = rangesToOffsets(ranges);

      skipNextPatch.current += 1;

      doc.change((d) => {
        for (const { start, end } of prev) {
          A.unmark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK);
        }
        for (const { start, end } of next) {
          A.mark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK, true);
        }
      });

      fire('editor', stored, ranges);
    };

    const applyFromCRDT = () => {
      let rawMarks: Array<{ start: number; end: number; name: string }>;
      try {
        rawMarks = A.marks(doc.current, path);
      } catch {
        return; // path missing / unsafe to read right now
      }

      if (model.getValueLength() === 0) return;

      const marks = rawMarks.filter((m) => m.name === D.FOLD_MARK);
      const next = offsetsToRanges(marks.map((m) => ({ start: m.start, end: m.end })));

      const hidden = getHiddenAreas(editor);
      const currentOffsets = toMarkRanges(model, hidden);
      const current = offsetsToRanges(currentOffsets);

      if (RangeUtil.eql(current, next)) {
        readyForEditorWrites.current = true;
        emitReadyOnce();
        return;
      }

      const mustClear = hidden.length > 0;

      if (!marks.length) {
        if (mustClear) {
          docUpdatingEditor.current = true;
          try {
            clear(editor);
          } finally {
            docUpdatingEditor.current = false;
          }
        }
        readyForEditorWrites.current = true;
        emitReadyOnce();
        return;
      }

      // Apply CRDT marks to the editor (fold by line numbers).
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
        emitReadyOnce();
      }

      fire('crdt', current, next);
    };

    // Seed once from CRDT (idle-safe).
    schedule(applyFromCRDT);

    // If empty at mount, seed again on first content.
    if (model.getValueLength() === 0) {
      const once = model.onDidChangeContent(() => {
        if (model.getValueLength() > 0) {
          schedule(applyFromCRDT);
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
        const hasMarksPatch = e.patches.some((p) => Array.isArray((p as any).marks));
        if (!hasMarksPatch) return;

        if (skipNextPatch.current > 0) {
          skipNextPatch.current -= 1;
          return; // echo of our last write; ignore
        }

        schedule(applyFromCRDT);
      });

    /**
     * Editor → CRDT: observe hidden-areas changes and write marks if they differ.
     */
    const { $ } = observe({ editor, bus$ }, life);
    $.pipe(rx.takeUntil(life.dispose$)).subscribe(async (e) => {
      if (!readyForEditorWrites.current) return;
      if (docUpdatingEditor.current) return;

      const offsets = toMarkRanges(model, e.areas); // existing helper (offsets)
      const ranges = offsetsToRanges(offsets);
      const stored = readStoredRanges();
      if (RangeUtil.eql(stored, ranges)) return;

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
