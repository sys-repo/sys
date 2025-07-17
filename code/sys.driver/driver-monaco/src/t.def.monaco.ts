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

  // Interfaces:
  export type IDisposable = monaco.IDisposable;
  export type IPosition = monaco.IPosition;
  export type IRange = monaco.IRange;
  export type IModelContentChangedEvent = editor.IModelContentChangedEvent;
  export type IModelDeltaDecoration = editor.IModelDeltaDecoration;
  export type ICursorPositionChangedEvent = editor.ICursorPositionChangedEvent;
  export type IModelLanguageChangedEvent = editor.IModelLanguageChangedEvent;
  export type ICodeEditor = editor.ICodeEditor;
  export type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
}
