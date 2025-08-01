import type * as monaco from 'monaco-editor';
import type { editor } from 'monaco-editor';

/**
 * Core Monaco library types:
 */
export namespace Monaco {
  /** Top-level Monaco API type. */
  export type Monaco = typeof monaco;

  /** Convenience aliases for common editor types. */
  export type Selection = monaco.Selection;
  export type Position = monaco.Position;

  export type Editor = editor.IStandaloneCodeEditor;
  export type TextModel = editor.ITextModel;
  export type Range = monaco.Range;
  export type CancellationToken = monaco.CancellationToken;

  /** Nested namespace for all the I-prefixed interfaces */
  export namespace I {
    // Monaco:
    export type IDisposable = monaco.IDisposable;
    export type IPosition = monaco.IPosition;
    export type IRange = monaco.IRange;
    export type ILink = monaco.languages.ILink;
    export type ILinksList = monaco.languages.ILinksList;

    // Editor:
    export type IModelContentChangedEvent = editor.IModelContentChangedEvent;
    export type IModelDeltaDecoration = editor.IModelDeltaDecoration;
    export type ICursorPositionChangedEvent = editor.ICursorPositionChangedEvent;
    export type IModelLanguageChangedEvent = editor.IModelLanguageChangedEvent;
    export type ICodeEditor = editor.ICodeEditor;
    export type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
    export type IMarkerData = editor.IMarkerData;
    export type IEditorDecorationsCollection = editor.IEditorDecorationsCollection;
  }

  // Languages:
  export namespace Lang {
    export type CompletionContext = monaco.languages.CompletionContext;
    export type CompletionList = monaco.languages.CompletionList;
    export type CompletionItem = monaco.languages.CompletionItem;
    export type ProviderResult<T> = monaco.languages.ProviderResult<T>;
  }
}

/**
 * The methods related to the editor's hidden-area list.
 * NB: explicitly declared because folding helpers
 *     are not (yet) in the `d.ts` shipped before v0.34.
 */
export type EditorHiddenMembers = {
  /** Current hidden (folded) ranges - expressed as model ranges. */
  getHiddenAreas(): Monaco.I.IRange[];
  /** Replace the hidden-area list (pass `[]` to reveal everything). */
  setHiddenAreas(ranges: Monaco.I.IRange[]): void;
  /** Fires after any fold/unfold (user action *or* `setHiddenAreas`). */
  onDidChangeHiddenAreas(listener: () => void): Monaco.I.IDisposable;
};
