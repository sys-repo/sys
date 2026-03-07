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
  spinning?: boolean;

  /** Enable word wrapping in the editor. */
  wordWrap?: boolean;
  /** Column at which to break lines when word wrap is enabled. */
  wordWrapColumn?: number;
  /** Content inset and gutter spacing for prompt-like layouts. */
  contentInset?: MonacoEditorContentInset;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  debug?: boolean;

  // Handlers:
  onMounted?: t.MonacoEditorMountedHandler;
  onChange?: t.MonacoEditorChangeHandler;
  onKeyDown?: t.MonacoEditorKeyDownHandler;
  onDispose?: t.MonacoEditorDisposedHandler;
};

/**
 * Handler for when the editor is ready.
 */
export type MonacoEditorMountedHandler = (e: MonacoEditorReady) => void;
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

/**
 * Handler for editor key-down events.
 */
export type MonacoEditorKeyDownHandler = (e: MonacoEditorKeyDown) => void;
/** Editor key-down event. */
export type MonacoEditorKeyDown = {
  readonly event: t.Monaco.I.IKeyboardEvent;
  readonly key: string;
  readonly modifiers: t.KeyboardModifierFlags;
  preventDefault(): void;
  stopPropagation(): void;
};

/**
 * Content inset options applied to Monaco editor rendering.
 */
export type MonacoEditorContentInset = {
  /** Top content padding in pixels. */
  top?: t.Pixels;
  /** Bottom content padding in pixels. */
  bottom?: t.Pixels;
  /** Monaco gutter/decorations width in pixels. */
  lineDecorationsWidth?: t.Pixels;
  /** Toggle line numbers when using inset layouts. */
  lineNumbers?: 'on' | 'off';
  /** Width reserved for line numbers. */
  lineNumbersMinChars?: number;
  /** Toggle glyph-margin column. */
  glyphMargin?: boolean;
};
