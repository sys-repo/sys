import { type t, Bus, Rx, Schedule } from './common.ts';

type Args = {
  bus$: t.EditorEventBus;
  foldMarks: boolean;
  editor: t.Monaco.Editor;
  monaco: t.Monaco.Monaco;
  life: t.Lifecycle;
};

/**
 * Monitor CRDT readiness and invoke the (stable) onReady handler.
 * - If foldMarks is false → emit on the next RAF tick.
 * - If foldMarks is true  → wait once for 'editor:crdt:folding:ready'.
 */
export function monitorReady(args: Args, onReady?: t.EditorCrdtBindingReadyHandler) {
  const { bus$, foldMarks, editor, monaco, life } = args;
  if (life.disposed) return;

  const dispose$ = life.dispose$;
  const $ = bus$.pipe(Rx.takeUntil(dispose$), Bus.Filter.ofPrefix('editor:crdt:'));
  const emitReady = () => onReady?.({ $, editor, monaco, dispose$ });

  if (!foldMarks) {
    // No folding sync → ready next frame.
    Schedule.raf(emitReady);
    return;
  }

  // Wait exactly once for code-folding to settle.
  $.pipe(
    Rx.filter((e) => e.kind === 'editor:crdt:folding:ready'),
    Rx.take(1),
  ).subscribe(emitReady);
}
