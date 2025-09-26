import { type t, Bus, Rx, Schedule } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { equalRanges } from './u.ts';

export const observe: t.EditorFoldingLib['observe'] = (args, until) => {
  const editor = args.editor as t.Monaco.Editor;
  const bus$ = args.bus$ ?? Bus.make();

  // Lifecycle:
  const life = Rx.lifecycle(until);

  // State:
  let areas: t.Monaco.I.IRange[] = snap();
  let initialAnnounced = false; // have we sent {initial:true} yet?

  // Helpers:
  function snap() {
    return getHiddenAreas(editor);
  }

  function emitFolding(next: t.Monaco.I.IRange[], asInitial: boolean) {
    if (life.disposed) return;
    const evt: t.EventEditorFolding =
      asInitial && !initialAnnounced
        ? { kind: 'editor:folding', areas: next, initial: true }
        : { kind: 'editor:folding', areas: next };

    Bus.emit(bus$, evt);
    if (evt.initial) initialAnnounced = true;
  }

  // Public stream:
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Rx.filter((e) => e.kind === 'editor:folding'),
    Rx.auditTime(0),
    Rx.throttleTime(0, undefined, { leading: true, trailing: true }),
    Rx.distinctUntilChanged((p, q) => equalRanges(p.areas.map(toSE), q.areas.map(toSE))),
  );

  /**
   * Event listeners:
   * - Hidden areas: emit immediately; first one carries {initial:true}.
   */
  const subHiddenAreas = editor.onDidChangeHiddenAreas(() => {
    areas = snap();
    emitFolding(areas, /* asInitial */ true); // first change announces initial
  });

  life.dispose$.subscribe(() => subHiddenAreas.dispose());

  /**
   * Model change: emit a baseline snapshot (non-initial) so consumers
   * have something to compare against; this does not flip UI.
   */
  const subonceInit = editor.onDidChangeModel(() => {
    /**
     * TODO 🐷
     */
    const now = snap();
    areas = now;
    emitFolding(now, /* asInitial */ false);
    subonceInit.dispose();
  });

  /**
   * Fallback: if no hidden-areas change occurs, after two RAFs announce
   * a one-time {initial:true} snapshot.
   */
  Schedule.frames(3).then(() => {
    if (life.disposed || initialAnnounced) return;

    const now = snap();
    areas = now;
    emitFolding(now, /* asInitial */ true);

    console.log(`🌼🌼🌼🌼🌼🌼🌼🌼🌼`);
  });

  // API:
  return Rx.toLifecycle<t.EditorFoldingAreaObserver>(life, {
    get $() {
      return $;
    },
    get areas() {
      return areas;
    },
  });
};

/** Helpers */
const toSE = (r: t.Monaco.I.IRange) => ({ start: r.startLineNumber, end: r.endLineNumber });
