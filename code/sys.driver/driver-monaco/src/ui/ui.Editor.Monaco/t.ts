import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MonacoEditorProps = {
  // Value:
  defaultValue?: string;
  language?: t.EditorLanguage;
  placeholder?: string;

  // Display:
  enabled?: boolean;
  autoFocus?: boolean | number;
  tabSize?: number;
  minimap?: boolean;
  readOnly?: boolean;
  fontSize?: t.Pixels;

  /** Enable word wrapping in the editor. */
  wordWrap?: boolean;
  /** Column at which to break lines when word wrap is enabled. */
  wordWrapColumn?: number;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
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
  readonly monaco: t.Monaco.Monaco;
  readonly editor: t.Monaco.Editor;
  readonly dispose$: t.Observable<t.DisposeEvent>;
};

/**
 * Handler for when the editor is disposed.
 */
export type MonacoEditorDisposedHandler = (e: MonacoEditorDisposed) => void;
/** Editor disposed event. */
export type MonacoEditorDisposed = {
  readonly editor: t.Monaco.Editor;
  readonly monaco: t.Monaco.Monaco;
};

/**
 * Handler for when the editor changes.
 */
export type MonacoEditorChangeHandler = (e: MonacoEditorChange) => void;
/** Editor change event. */
export type MonacoEditorChange = {
  readonly event: t.Monaco.I.IModelContentChangedEvent;
  readonly editor: t.Monaco.Editor;
  readonly monaco: t.Monaco.Monaco;
  readonly content: t.EditorContent;
  readonly selections: t.EditorSelection[];
};
