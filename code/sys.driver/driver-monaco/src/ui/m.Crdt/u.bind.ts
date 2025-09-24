import { type t, A, Obj, rx, Time, Util } from './common.ts';
import { diffToSplices } from './u.diffToSplices.ts';

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
export const bind: t.EditorCrdtLib['bind'] = async (args) => {
  const { editor, doc, path } = args;
  const life = rx.lifecycle(args.until);
  const schedule = Time.scheduler(life, 'micro');
  let model = editor.getModel() ?? undefined;

  if (!model) model = await Util.Editor.waitForModel(editor, life);
  if (!model) {
    if (life.disposed) return wrangle.noop(life, doc, path);
    throw new Error('A model could not be retrieved from the editor.');
  }

  const docEvents = doc.events(life);
  const hasPath = (path ?? []).length > 0;
  let _isPulling = false;

  const $$ = args.bus$ ?? rx.subject<t.EditorEvent>();
  const fire = (trigger: 'editor' | 'crdt', before: string, after: string) => {
    if (after === before) return;
    $$.next({ kind: 'change:text', trigger, path, change: { before, after } });
  };

  const getValue = () => {
    if (model.isDisposed()) {
      console.warn('Attempted to continue binding after model disposed. Disposing binding.');
      life.dispose();
      return '';
    }
    return model.getValue();
  };

  // Ensure path exists:
  if (hasPath) {
    schedule(() => doc.change((d) => Obj.Path.Mutate.ensure(d, path, '')));
  }

  // Prime Monaco once
  const initialText = hasPath ? (Obj.Path.get<string>(doc.current, path) ?? '') : '';
  if (hasPath && getValue() !== initialText) {
    _isPulling = true;
    try {
      model.setValue(initialText);
    } finally {
      _isPulling = false;
    }
  }

  /**
   * PULL: CRDT → Monaco
   * Patch editor from its current text → event.after snapshot and emit 'crdt'.
   */
  docEvents.$.pipe(
    rx.filter(() => hasPath),
    rx.filter((e) => e.patches.some((p) => Obj.Path.Rel.overlaps(p.path, path))),
    rx.takeUntil(life.dispose$),
  ).subscribe((e) => {
    if (life.disposed || model.isDisposed()) return;

    const target = Obj.Path.get<string>(e.after, path) ?? '';
    const current = getValue();
    if (current === target) return; // NB: already in sync (no-op).

    const splices = diffToSplices(current, target);

    _isPulling = true;
    try {
      model.pushEditOperations(
        [],
        [...splices].reverse().map((s) => {
          const start = model.getPositionAt(s.index);
          const end = model.getPositionAt(s.index + s.delCount);
          const range = Util.Range.fromPosition(start, end);
          return { range, text: s.insertText };
        }),
        () => null,
      );
    } finally {
      _isPulling = false;
    }

    // Emit the transition we actually applied to Monaco.
    fire('crdt', current, getValue());
  });

  /**
   * PUSH: Monaco → CRDT
   * Coalesce per microtask; diff CRDT.before → editor.now; write when idle; always emit 'editor'.
   */
  let flushing = false;
  let planBefore: string | null = null;
  let planAfter: string | null = null;

  const editorChangeSub = model.onDidChangeContent(() => {
    if (!hasPath || _isPulling || life.disposed || model.isDisposed()) return;

    if (!flushing) {
      planBefore = Obj.Path.get<string>(doc.current, path) || '';
      flushing = true;
    }
    planAfter = getValue();

    schedule(async () => {
      if (!flushing) return;
      const before = planBefore ?? '';
      const after = planAfter ?? '';

      // Reset the plan before awaiting:
      flushing = false;
      planBefore = planAfter = null;

      if (!hasPath || _isPulling || life.disposed || model.isDisposed()) return;
      if (before === after) return;

      const splices = diffToSplices(before, after);

      doc.change((d) => {
        const readDraft = () => Obj.Path.get<string>(d as any, path) || '';
        for (const s of [...splices].reverse()) {
          const draft = readDraft();
          const maxIdx = draft.length;
          const idx = Math.max(0, Math.min(s.index, maxIdx));
          const maxDel = Math.max(0, Math.min(s.delCount, maxIdx - idx));
          A.splice(d, path as any, idx, maxDel, s.insertText);
        }
      });

      // Always announce local user-edit transition.
      fire('editor', before, after);
    });
  });

  life.dispose$.subscribe(() => editorChangeSub.dispose());

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
  noop(life: t.Lifecycle, doc: t.Crdt.Ref, path: t.ObjectPath) {
    const model = {} as any;
    return rx.toLifecycle<t.EditorCrdtBinding>(life, { $: rx.EMPTY, doc, path, model });
  },
  change(before: string, after: string): t.EditorChangeText['change'] {
    return {
      get before() {
        return before;
      },
      get after() {
        return after;
      },
    };
  },
} as const;
