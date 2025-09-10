import { type t, A, Obj, rx, Util } from './common.ts';
import { diffToSplices } from './u.diffToSplices.ts';

type C = t.EditorCrdtLocalChange;

/**
 * Bind a Monaco text-model to a CRDT document reference.
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
export const bind: t.EditorCrdtLib['bind'] = async (editor, doc, path, until) => {
  const life = rx.lifecycle(until);
  let model = editor.getModel() ?? undefined;

  // Wait for a model if it isn't ready yet.
  if (!model) {
    model = await Util.Editor.waitForModel(editor, life);
  }

  if (!model) {
    // Case A: we were cancelled (effect unmounted) before a model attached.
    if (life.disposed) return wrangle.noop(life, doc, path);

    // Case B: still active, but no model → real error.
    throw new Error('A model could not be retrieved from the editor.');
  }

  const events = doc.events(life);
  const hasPath = (path ?? []).length > 0;
  let _isPulling = false; // NB: echo-guard.

  // Auto-dispose binding if the model tears down.
  const modelDisposeSub = (model as any).onWillDispose?.(() => life.dispose());
  life.dispose$.subscribe(() => modelDisposeSub?.dispose?.());

  // Capture current readOnly and restore on dispose if we changed it.
  const originalReadOnly = (editor as any).getRawOptions?.().readOnly;
  if (!hasPath) editor.updateOptions({ readOnly: true });
  life.dispose$.subscribe(() => {
    if (!hasPath && originalReadOnly !== undefined) {
      editor.updateOptions({ readOnly: originalReadOnly });
    }
  });

  const $$ = rx.subject<C>();
  const fire = (trigger: C['trigger'], before: string, after: string) => {
    if (after !== before) {
      const change = wrangle.change(before, after);
      $$.next({ trigger, path, change });
    }
  };

  const getValue = () => {
    if (model.isDisposed()) {
      const msg = `Attempted to continue binding after UI/editor model has been disposed. Disposing of binding now.`;
      console.warn(msg);
      console.trace();
      life.dispose();
      return '';
    }
    return model.getValue();
  };

  // Ensure the editor has the current value of the CRDT document.
  const initialText = Obj.Path.get<string>(doc.current, path) ?? '';
  if (hasPath && getValue() !== initialText) {
    _isPulling = true; // ← NB: suppress local echo.
    try {
      model.setValue(initialText);
    } finally {
      _isPulling = false;
    }
  }

  // Ensure CRDT path exists and prime Monaco with its current value:
  doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));

  // Disable the editor if there is no [path] to write.
  if (!hasPath) editor.updateOptions({ readOnly: true });

  /**
   * PULL: CRDT ➜ Monaco (remote edits).
   */
  events.$.pipe(
    rx.filter((e) => hasPath),
    rx.filter((e) => e.patches.some((p) => Obj.Path.Rel.overlaps(p.path, path))),
    rx.takeUntil(life.dispose$),
  ).subscribe((e) => {
    const before = Obj.Path.get<string>(e.before, path) ?? '';
    const after = Obj.Path.get<string>(e.after, path) ?? '';
    if (before === after || getValue() === after) return; // ← Already synced.

    // Convert before ➜ after into one-or-more splices.
    const splices = diffToSplices(before, after);

    /**
     * Apply from highest offset down so earlier edits don’t shift later indices.
     * (NB: mirrors the Monaco ➜ CRDT logic).
     */
    _isPulling = true;
    try {
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
    } finally {
      _isPulling = false;
    }

    fire('crdt', before, getValue());
  });

  /**
   * PUSH: Monaco ➜ CRDT (local edits).
   */
  const editorChangeSub = model.onDidChangeContent((e) => {
    if (!hasPath) return;
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
  change(before: string, after: string): C['change'] {
    return {
      get before() {
        return before;
      },
      get after() {
        return after;
      },
    };
  },

  noop(life: t.Lifecycle, doc: t.Crdt.Ref, path: t.ObjectPath) {
    return rx.toLifecycle<t.EditorCrdtBinding>(life, {
      $: rx.EMPTY,
      doc,
      path,
      model: {} as any, // NB: not used; binding is effectively inert.
    });
  },
} as const;
