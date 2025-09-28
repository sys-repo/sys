import { A, D, Rx, Schedule, type t } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';

import {
  clampOffset,
  equalOffsets,
  makeMarksEmitter,
  parentLinesFromOffsets,
  rangesToOffsets,
  readStoredOffsets,
  type FoldOffset,
} from './u.bind.impl.u.ts';

export function impl(args: {
  bus$: t.EditorEventBus;
  model: t.Monaco.TextModel;
  editor: t.Monaco.Editor;
  doc: t.CrdtRef;
  path: t.ObjectPath;
  life: t.Lifecycle;
}) {
  const { bus$, model, path, editor, doc, life } = args;

  // Guards:
  let readyForEditorWrites = false; //  ← UI→CRDT allowed after initial seed.
  let docUpdatingEditor = false; //     ← Suppress echo while applying CRDT→Editor.
  let skipNextPatch = 0; //             ← Ignore next marks patch after UI→CRDT write.

  // Curried emitter (model+bus+path baked in)
  const emitMarks = makeMarksEmitter(bus$, model, path);

  /**
   * Apply desired fold state using Monaco public commands.
   * - Empty => unfoldAll
   * - Non-empty => single batched 'editor.fold' with parent lines.
   */
  function applyViaCommands(nextOffsets: FoldOffset[]) {
    const areasBefore = getHiddenAreas(editor);

    if (nextOffsets.length === 0) {
      editor.trigger('monaco.hidden', 'editor.unfoldAll', undefined);
      const areasAfter = getHiddenAreas(editor);
      emitMarks('crdt', rangesToOffsets(model, areasBefore), rangesToOffsets(model, areasAfter));
      return;
    }

    // Convert parent-line offsets into 0-based selectionLines for one batched fold.
    const parents0 = parentLinesFromOffsets(model, nextOffsets);
    if (parents0.length === 0) {
      // nothing to fold; still emit if visible state changed
      const areasAfter = getHiddenAreas(editor);
      emitMarks('crdt', rangesToOffsets(model, areasBefore), rangesToOffsets(model, areasAfter));
      return;
    }

    editor.trigger('monaco.hidden', 'editor.fold', { selectionLines: parents0 });

    const areasAfter = getHiddenAreas(editor);
    emitMarks('crdt', rangesToOffsets(model, areasBefore), rangesToOffsets(model, areasAfter));
  }

  /**
   * CRDT → Editor: read CRDT marks and apply to Monaco (if needed).
   * Comparison is done in offsets to avoid churn.
   */
  function syncFromCRDT() {
    let rawMarks: Array<{ start: number; end: number; name: string }>;
    try {
      rawMarks = A.marks(doc.current, path);
    } catch {
      return; // path missing / unsafe to read right now
    }
    if (model.getValueLength() === 0) return;

    const marks = rawMarks.filter((m) => m.name === D.FOLD_MARK);
    const nextOffsets: FoldOffset[] = marks.map((m) => ({
      start: clampOffset(model, m.start),
      end: clampOffset(model, m.end),
    }));

    // Compare to current by offsets (derived from hidden areas).
    const currentOffsets = toMarkRanges(model, getHiddenAreas(editor)).map((r) => ({
      start: clampOffset(model, r.start),
      end: clampOffset(model, r.end),
    }));

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
  const { $ } = observe({ editor, bus$ }, life);
  $.pipe(Rx.takeUntil(life.dispose$)).subscribe(async (e) => {
    if (!readyForEditorWrites) return;
    if (docUpdatingEditor) return;

    const currentOffsets = toMarkRanges(model, e.areas).map((r) => ({
      start: clampOffset(model, r.start),
      end: clampOffset(model, r.end),
    }));
    const storedOffsets = readStoredOffsets(doc, path).map((o) => ({
      start: clampOffset(model, o.start),
      end: clampOffset(model, o.end),
    }));

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

    // Emit as ranges (presentation edge only).
    emitMarks('editor', storedOffsets, currentOffsets);
  });
}
