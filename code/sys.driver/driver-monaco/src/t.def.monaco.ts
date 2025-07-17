import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

/**
 * Core Monaco library types:
 */
export namespace Monaco {
  /** Top-level Monaco API type. */
  export type Monaco = typeof monaco;

  /** Convenience aliases for common editor types. */
  export type Editor = editor.IStandaloneCodeEditor;
  export type Selection = monaco.Selection;
  export type TextModel = editor.ITextModel;

  export type IDisposable = monaco.IDisposable;
  export type IPosition = monaco.IPosition;
  export type IModelContentChangedEvent = editor.IModelContentChangedEvent;
  export type IModelDeltaDecoration = editor.IModelDeltaDecoration;
  export type ICursorPositionChangedEvent = editor.ICursorPositionChangedEvent;
  export type IModelLanguageChangedEvent = editor.IModelLanguageChangedEvent;
}
