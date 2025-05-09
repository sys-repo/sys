import { rx, type t } from './common.ts';
import { Caret, Color } from './u.ts';

/**
 * Manages a set of carets for an editor.
 */
export const EditorCarets = {
  Color,

  /**
   * Factory
   */
  create(
    editor: t.MonacoCodeEditor,
    options: { dispose$?: t.Observable<any> } = {},
  ): t.EditorCarets {
    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;

    const handlerDidDispose = editor.onDidDispose(dispose);
    dispose$.subscribe(() => {
      handlerDidDispose.dispose();
      api.clear();
      $.complete();
    });

    const $ = new rx.Subject<t.EditorCaretChanged>();
    const carets = new Map<string, t.EditorCaret>();

    const api: t.EditorCarets = {
      $: $.pipe(rx.takeUntil(dispose$)),
      editor,

      get current() {
        return Array.from(carets.values());
      },

      identity(id: string): t.EditorCaret {
        if (carets.has(id)) return carets.get(id)!;
        const caret = Caret.create(editor, id);
        carets.set(id, caret);
        caret.$.subscribe((e) => $.next(e));
        caret.dispose$.subscribe(() => carets.delete(id));
        return caret;
      },

      delete(id: string) {
        if (!carets.has(id)) return false;
        carets.get(id)?.dispose();
        return true;
      },

      clear() {
        api.current.forEach((caret) => caret.dispose());
        return api;
      },

      /**
       * Lifecycle.
       */
      dispose,
      dispose$,
      get disposed() {
        return life.disposed;
      },
    };

    return api;
  },
} as const;
