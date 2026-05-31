import type { t } from './common.ts';
import type * as TBind from './t.bind.ts';

/**
 * Tools for working with the code-hiding aspects of the editor.
 */
export declare namespace EditorFolding {
  /** Runtime library surface. */
  export type Lib = {
    /** Pure CRDT ⇄ Monaco fold-mark synchronizer. */
    readonly bindFoldMarks: Bind;

    /** React hook for binding to a CRDT. */
    readonly useFoldMarks: Use;

    /** Watch the editor's hidden-area list. */
    observe(
      args: { editor: t.Monaco.Editor; bus$?: t.EditorBus.Subject },
      until?: t.UntilInput,
    ): Observer;

    /** Fold one or more whole lines. */
    fold(ed: t.Monaco.Editor, start: t.Index, end?: t.Index): void;

    /** Unfold one or more whole lines. */
    unfold(ed: t.Monaco.Editor, start: t.Index, end?: t.Index): void;

    /** Reveal every line by unfolding all folded ranges. */
    clear(ed: t.Monaco.Editor): void;

    /** Convert editor hidden areas → Automerge sequence ranges. */
    toMarkRanges(model: t.Monaco.TextModel, areas: t.Monaco.I.IRange[]): t.Crdt.Marks.Range[];

    /** Return all folded regions, independent of scroll position. */
    getHiddenAreas(editor: t.Monaco.Editor): t.Monaco.I.IRange[];
  };

  /** Fold offset range. */
  export type Offset = { start: number; end: number };

  /** Live observer of the editor's hidden-area list. */
  export type Observer = t.Lifecycle & {
    readonly $: t.Observable<t.EditorEvent.Crdt.Folding>;
    readonly areas: t.Monaco.I.IRange[];
  };

  export type Use = TBind.Use;
  export type UseArgs = TBind.UseArgs;
  export type Bind = TBind.Bind;
  export type BindArgs = TBind.BindArgs;

  /** Fold binding contracts. */
  export namespace Binding {
    export type Instance = TBind.BindingInstance;
  }
}
