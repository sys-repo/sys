import { type t, Bus, RangeUtil, Rx, Schedule } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { equalRanges } from './u.ts';

const toSE = RangeUtil.toStartEnd;

export const observe: t.EditorFoldingLib['observe'] = (args, until) => {
  const editor = args.editor as t.Monaco.Editor;
  const bus$ = args.bus$ ?? Bus.make();
  const life = Rx.lifecycle(until);

  /**
   * Safe reader:
   * - During model swaps/teardown the editor's model or view-model can be null.
   * - Return [] in that case to avoid crashing and to represent “no folded areas”.
   */
  const readAreas = () =>
    editor.getModel() ? getHiddenAreas(editor) : ([] as t.Monaco.I.IRange[]);

  let areas = readAreas();
  let initialSent = false;

  const emit = (next: t.Monaco.I.IRange[], initial = false) => {
    if (life.disposed) return;
    const evt: t.EventEditorFolding =
      initial && !initialSent
        ? { kind: 'editor:folding', areas: next, initial: true }
        : { kind: 'editor:folding', areas: next };
    Bus.emit(bus$, evt);
    if ((evt as any).initial) initialSent = true;
  };

  // Public observable: folding events, deduped
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Rx.filter((e) => e.kind === 'editor:folding'),
    Rx.auditTime(0), // coalesce per microtask
    Rx.distinctUntilChanged((p, q) => equalRanges(p.areas.map(toSE), q.areas.map(toSE))),
  );

  // Editor folds changed → emit (first one carries {initial:true})
  const subHidden = editor.onDidChangeHiddenAreas(() => emit(readAreas(), true));
  life.dispose$.subscribe(() => subHidden.dispose());

  // Model changed → emit baseline snapshot (not initial-gating)
  const subModel = editor.onDidChangeModel(() => {
    areas = readAreas();
    emit(areas, false);
    subModel.dispose();
  });

  // Fallback: ensure at least one {initial:true} after 2 frames
  Schedule.frames(2).then(() => {
    if (!life.disposed && !initialSent) {
      areas = readAreas();
      emit(areas, true);
    }
  });

  /**
   * API:
   */
  return Rx.toLifecycle<t.EditorFoldingAreaObserver>(life, {
    get $() {
      return $;
    },
    get areas() {
      return areas;
    },
  });
};
