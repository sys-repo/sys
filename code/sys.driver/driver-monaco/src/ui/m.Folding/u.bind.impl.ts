import { type t, A, Bus, D, Rx, Schedule } from './common.ts';
import {
  clampOffsetSE,
  equalOffsets,
  makeMarksEmitter,
  parentLinesFromOffsets,
  rangesToOffsets,
  readStoredOffsets,
} from './u.bind.impl.u.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';

type IRange = t.Monaco.I.IRange;

export function impl(args: {
  bus$: t.EditorEventBus;
  model: t.Monaco.TextModel;
  editor: t.Monaco.Editor;
  doc: t.CrdtRef;
  path: t.ObjectPath;
  life: t.Lifecycle;
}) {
  const { bus$, model, path, editor, doc, life } = args;
  const observer = observe({ editor, bus$ }, life);

  // Guards:
  let readyForEditorWrites = false; //  ← UI→CRDT allowed after initial seed.
  let docUpdatingEditor = false; //     ← Suppress echo while applying CRDT→Editor.
  let skipNextPatch = 0; //             ← Ignore next marks patch after UI→CRDT write.
  let initialFired = false; //          ← Guard for once-only initial event firing.

  // Curried emitter (model+bus+path baked in)
  const emitMarks = makeMarksEmitter(bus$, model, path);

  /**
   * Apply desired fold state using Monaco public commands.
   * - Empty => unfoldAll
   * - Non-empty => single batched 'editor.fold' with parent lines.
   */
  function applyViaCommands(nextOffsets: t.FoldOffset[]) {
    const trigger = (handleId: string, selectionLines?: number[]) => {
      const areasBefore = getHiddenAreas(editor);
      const payload = selectionLines ? { selectionLines } : undefined;
      editor.trigger('monaco.hidden', handleId, payload);

      const before = rangesToOffsets(model, areasBefore);
      const after = rangesToOffsets(model, getHiddenAreas(editor));
      emitMarks('crdt', before, after);
    };

    if (nextOffsets.length === 0) {
      // No marks:
      trigger('editor.unfoldAll');
    } else {
      // Has code-folded marks:
      trigger('editor.fold', parentLinesFromOffsets(model, nextOffsets));
    }
  }

  /**
   * CRDT → Editor: read CRDT marks and apply to Monaco (if needed).
   * Comparison is done in offsets to avoid churn.
   */
  function syncFromCRDT() {
    let rawMarks: t.Crdt.Marks.Mark[];
    try {
      rawMarks = A.marks(doc.current, path);
    } catch {
      return; // Path is missing / unsafe to read right now.
    }

    if (model.getValueLength() === 0) return;

    const marks = rawMarks.filter((m) => m.name === D.FOLD_MARK);
    const nextOffsets = marks.map((m) => clampOffsetSE(model, m));

    // Compare to current by offsets (derived from hidden areas).
    const currentMarkRanges = toMarkRanges(model, getHiddenAreas(editor));
    const currentOffsets = currentMarkRanges.map((r) => clampOffsetSE(model, r));

    // Fire initial <ready> event.
    if (!initialFired) {
      initialFired = true;
      const ready = (areas: IRange[]) => Bus.emit(bus$, { kind: 'editor:folding.ready', areas });
      if (marks.length === 0) {
        ready([]);
      } else {
        observer.$.pipe(Rx.take(1)).subscribe((e) => ready(e.areas));
      }
    }

    if (equalOffsets(currentOffsets, nextOffsets)) {
      readyForEditorWrites = true;
      return;
    }

    docUpdatingEditor = true;
    try {
      applyViaCommands(nextOffsets);
    } finally {
      docUpdatingEditor = false;
      readyForEditorWrites = true;
    }
  }

  // Seed once from CRDT (correctness first).
  syncFromCRDT();

  // If empty at mount, seed again on first content.
  if (model.getValueLength() === 0) {
    const once = model.onDidChangeContent(() => {
      if (model.getValueLength() === 0) return;
      syncFromCRDT();
      once.dispose();
    });
    life.dispose$.subscribe(() => once.dispose());
  }

  // CRDT → Editor: watch patches under path (incl. marks array).
  const events = doc.events(life);
  events
    .path(path)
    .$.pipe(Rx.takeUntil(life.dispose$))
    .subscribe((e) => {
      const hasMarksPatch = e.patches.some((p) => Array.isArray((p as any).marks));
      if (!hasMarksPatch) return;

      if (skipNextPatch > 0) {
        skipNextPatch -= 1;
        return; // echo of our last write
      }

      // Coalesce to the next microtask and tie to lifecycle.
      Schedule.queue(syncFromCRDT, 'micro', life);
    });

  // Editor → CRDT: persist hidden areas iff they differ from stored marks.
  observer.$.subscribe((e) => {
    if (!readyForEditorWrites) return;
    if (docUpdatingEditor) return;

    const currentOffsets = toMarkRanges(model, e.areas).map((r) => clampOffsetSE(model, r));
    const storedOffsets = readStoredOffsets(doc, path).map((o) => clampOffsetSE(model, o));
    if (equalOffsets(storedOffsets, currentOffsets)) return;

    skipNextPatch += 1;
    doc.change((d) => {
      for (const { start, end } of storedOffsets) {
        A.unmark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK);
      }
      for (const { start, end } of currentOffsets) {
        A.mark(d, path, { start, end, expand: 'none' }, D.FOLD_MARK, true);
      }
    });

    // Emit as ranges:
    emitMarks('editor', storedOffsets, currentOffsets);
  });
}
