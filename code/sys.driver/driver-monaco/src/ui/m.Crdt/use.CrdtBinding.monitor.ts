import { type t, Rx, Schedule } from './common.ts';

export function monitorReady(args: {
  bus$: t.EditorEventBus;
  foldMarks: boolean;
  editor: t.Monaco.Editor;
  monaco: t.Monaco.Monaco;
  life: t.Lifecycle;
  onReadyRef: React.RefObject<t.EditorCrdtBindingReadyHandler | undefined>;
}) {
  const { onReadyRef, bus$, foldMarks, editor, monaco, life } = args;
  if (life.disposed) return;

  const dispose$ = life.dispose$;
  const $ = bus$.pipe(Rx.takeUntil(dispose$));
  const emitReady = () => onReadyRef.current?.({ $, editor, monaco, dispose$ });

  if (!foldMarks) {
    // No folding sync → ready next frame:
    Schedule.raf(emitReady);
    return;
  }

  // Wait exactly once for code-folding to settle:
  $.pipe(
    Rx.filter((e) => e.kind === 'editor:folding.ready'),
    Rx.take(1),
  ).subscribe(emitReady);
}
