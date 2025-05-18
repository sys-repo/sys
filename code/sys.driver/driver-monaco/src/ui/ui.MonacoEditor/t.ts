import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MonacoEditorProps = {
  debug?: boolean;

  text?: string;
  language?: t.EditorLanguage;
  theme?: t.CommonTheme;
  placeholder?: string;
  enabled?: boolean;
  focusOnLoad?: boolean;
  tabSize?: number;
  minimap?: boolean;
  readOnly?: boolean;
  style?: t.CssValue;

  onChange?: t.MonacoEditorChangeHandler;
  onReady?: t.MonacoEditorReadyHandler;
  onDispose?: t.MonacoEditorDisposedHandler;
};

/**
 * Editor ready.
 */
export type MonacoEditorReadyHandler = (e: MonacoEditorReadyArgs) => void;
export type MonacoEditorReadyArgs = {
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
  readonly carets: t.EditorCarets;
  readonly dispose$: t.Observable<void>;
};

/**
 * Editor disposed.
 */
export type MonacoEditorDisposedHandler = (e: MonacoEditorDisposedArgs) => void;
export type MonacoEditorDisposedArgs = {
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
};

/**
 * Editor changed.
 */
export type MonacoEditorChangeHandler = (e: MonacoEditorChangeArgs) => void;
export type MonacoEditorChangeArgs = {
  readonly event: t.monaco.editor.IModelContentChangedEvent;
  readonly editor: t.MonacoCodeEditor;
  readonly monaco: t.Monaco;
  readonly content: t.EditorContent;
  readonly selections: t.EditorSelection[];
};
