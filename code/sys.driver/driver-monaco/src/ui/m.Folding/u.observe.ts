import { type t, Bus, RangeUtil, Rx } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { equalRanges } from './u.ts';

type IRange = t.Monaco.I.IRange;
const toSE = RangeUtil.toStartEnd;

export const observe: t.EditorFoldingLib['observe'] = (args, until) => {
  const editor = args.editor as t.Monaco.Editor;
  const bus$ = args.bus$ ?? Bus.make();
  const life = Rx.lifecycle(until);

  // Safe reader (model may be null during swaps/teardown):
  const readAreas = (): IRange[] => (editor.getModel() ? getHiddenAreas(editor) : []);
  let areas = readAreas();

  const emit = (next: IRange[], trigger: t.EventCrdtFolding['trigger']) => {
    if (life.disposed) return;
    areas = next; // keep snapshot current
    Bus.emit(bus$, 'micro', { kind: 'editor:crdt:folding', trigger, areas });
  };

  // Public observable: folding events, coalesced & deduped.
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Rx.filter((e) => e.kind === 'editor:crdt:folding'),
    Rx.auditTime(0), // ← coalesce per microtask.
    Rx.distinctUntilChanged((p, q) => equalRanges(p.areas.map(toSE), q.areas.map(toSE))),
  );

  // Model changed → emit one baseline snapshot on attach.
  const subInitialModelChange = editor.onDidChangeModel(() => {
    emit(readAreas(), 'editor');
    subInitialModelChange.dispose();
  });

  // Editor hidden-areas changed → emit snapshot.
  const subHiddenAreaChanges = editor.onDidChangeHiddenAreas(() => emit(readAreas(), 'editor'));

  // Dispose of listeners:
  life.dispose$.subscribe(() => {
    subInitialModelChange.dispose();
    subHiddenAreaChanges.dispose();
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
