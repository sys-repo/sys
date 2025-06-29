import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MonacoEditorProps = {
  defaultValue?: string;
  language?: t.EditorLanguage;
  placeholder?: string;

  enabled?: boolean;
  autoFocus?: boolean | number;
  tabSize?: number;
  minimap?: boolean;
  readOnly?: boolean;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssValue;
  debug?: boolean;

  // Handlers:
  onChange?: t.MonacoEditorChangeHandler;
  onReady?: t.MonacoEditorReadyHandler;
  onDispose?: t.MonacoEditorDisposedHandler;
};

/**
 * Handler for when the editor is ready.
 */
export type MonacoEditorReadyHandler = (e: MonacoEditorReady) => void;
/** Editor ready event. */
export type MonacoEditorReady = {
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
  readonly carets: t.EditorCarets;
  readonly dispose$: t.Observable<void>;
};

/**
 * Handler for when the editor is disposed.
 */
export type MonacoEditorDisposedHandler = (e: MonacoEditorDisposed) => void;
/** Editor disposed event. */
export type MonacoEditorDisposed = {
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
};

/**
 * Handler for when the editor changes.
 */
export type MonacoEditorChangeHandler = (e: MonacoEditorChange) => void;
/** Editor change event. */
export type MonacoEditorChange = {
  readonly event: t.monaco.editor.IModelContentChangedEvent;
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
  readonly content: t.EditorContent;
  readonly selections: t.EditorSelection[];
};
