import { type t, A, Obj, rx } from './common.ts';
import { diffToSplices } from './u.diffToSplices.ts';

/**
 * Bind a Monaco model (or editor instance) to a CRDT document reference.
 *
 *  - Local edits → CRDT:
 *        On every model change we write the new text to `doc[path]`
 *        and raise `onRefChange` so callers can react to the new ref.
 *
 *  - Remote CRDT edits → Monaco:
 *        Whenever the bound path changes on `doc.events().$`
 *        we patch the model via `pushEditOperations`, preserving undo/redo.
 *
 *  - A tiny "echo-guard" (`isPulling`) stops the two flows looping on each
 *    other while still keeping both worlds fully undoable.
 *
 */
export const bind: t.EditorCrdtLib['bind'] = (monaco, doc, path) => {
  const life = rx.lifecycle();
  const model = wrangle.model(monaco);
  const events = doc.events(life);
  let _isPulling = false; // NB: echo-guard.

  type C = t.EditorCrdtLocalChange;
  const $$ = rx.subject<C>();
  const fire = (trigger: C['trigger'], before: string, after: string) => {
    if (after !== before) {
      const change = { before, after };
      $$.next({ trigger, path, change });
    }
  };

  // Ensure CRDT path exists and prime Monaco with its current value:
  doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));

  const initialText = Obj.Path.get<string>(doc.current, path) ?? '';
  if (model.getValue() !== initialText) model.setValue(initialText);

  /**
   * PULL: CRDT ➜ Monaco (remote edits).
   */
  events.$.pipe(rx.filter((e) => e.patches.some((p) => pathsOverlap(p.path, path)))).subscribe(
    (e) => {
      const before = Obj.Path.get<string>(e.before, path) ?? '';
      const after = Obj.Path.get<string>(e.after, path) ?? '';
      if (before === after || model.getValue() === after) return; // ← Already synced.

      // Convert before ➜ after into one-or-more splices.
      const splices = diffToSplices(before, after);

      /**
       * Apply from highest offset down so earlier edits don’t shift later indices.
       * (NB: mirrors the Monaco ➜ CRDT logic).
       */
      _isPulling = true;
      model.pushEditOperations(
        [], // NB: keep selections.
        splices.reverse().map((s) => {
          const start = model.getPositionAt(s.index);
          const end = model.getPositionAt(s.index + s.delCount);
          return {
            range: {
              startLineNumber: start.lineNumber,
              startColumn: start.column,
              endLineNumber: end.lineNumber,
              endColumn: end.column,
            },
            text: s.insertText,
          };
        }),
        () => null,
      );

      _isPulling = false;
      fire('crdt', before, model.getValue());
    },
  );

  /**
   * PUSH: Monaco ➜ CRDT (local edits).
   */
  const editorChangeSub = model.onDidChangeContent((e) => {
    if (_isPulling) return; // ignore CRDT-initiated ops.

    const read = () => Obj.Path.get<string>(doc.current, path) || '';
    const before = read();

    /**
     * Gather edits in descending offset order so earlier splices
     * don't shift the positions of later ones.
     */
    const changes = [...e.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);

    /**
     * Apply each change as an Automerge splice:
     */
    doc.change((d) => {
      for (const c of changes) {
        A.splice(d, path as any, c.rangeOffset, c.rangeLength, c.text);
      }
    });

    // Alert listeners:
    fire('editor', before, read());
  });

  /**
   * Cleanup:
   */
  life.dispose$.subscribe(() => editorChangeSub.dispose());

  /**
   * API:
   */
  return rx.toLifecycle<t.EditorCrdtBinding>(life, {
    $: $$.pipe(rx.takeUntil(life.dispose$)),
    doc,
    path,
    model,
  });
};

/**
 * Helpers:
 */
const wrangle = {
  model(input: t.MonacoTextModel | t.MonacoCodeEditor): t.MonacoTextModel {
    if (typeof (input as any).getModel === 'function') {
      const m = (input as t.MonacoCodeEditor).getModel();
      if (m) return m;
    }
    return input as t.MonacoTextModel;
  },
} as const;

/**
 * True when two object-paths overlap, i.e. one is a prefix of the other.
 */
const pathsOverlap = (a: t.ObjectPath, b: t.ObjectPath): boolean => {
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i += 1) {
    if (a[i] !== b[i]) return false; // Diverges at segment i.
  }
  return true; // One is prefix of the other
};
