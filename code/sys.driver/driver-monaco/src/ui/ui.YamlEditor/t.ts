import type { t } from './common.ts';

/**
 * Component:
 */
export type YamlEditorProps = {
  bus$?: t.EditorBus.Subject;
  repo?: t.CrdtRepo;
  signals?: Partial<t.YamlEditorSignals>;
  path?: t.YamlSyncArgsInput['path'];

  documentId?: t.YamlEditorDocumentIdProps;
  editor?: t.YamlEditorMonacoProps;
  footer?: Pick<t.YamlEditorFooterProps, 'visible'> & { repo?: boolean };

  /** Enable or disable YAML syntax diagnostics (default: true). */
  diagnostics?: YamlEditorDiagnostics;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.EditorCrdt.Binding.ReadyHandler;
  onDocumentLoaded?: t.YamlEditorDocumentLoadedHandler;
  onCursor?: (e: t.MonacoDriver.Cursor) => void;
};

/** Display settings for diagnostics (error markers).  */
export type YamlEditorDiagnostics = 'none' | 'syntax';

/** Fires when a new document (crdt) is loaded into the editor. */
export type YamlEditorDocumentLoadedHandler = (e: YamlEditorDocumentLoaded) => void;
export type YamlEditorDocumentLoaded = {
  doc: t.CrdtRef;
  events: t.Crdt.Events;
  dispose$: t.DisposeObservable;
};

/**
 * State wrapped in signals.
 */
export type YamlEditorSignals = {
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
  doc: t.Signal<t.CrdtRef | undefined>;
  yaml: t.Signal<t.EditorYaml.State | undefined>;
};

/**
 * Editor sub-props:
 */
export type YamlEditorMonacoProps = Pick<
  t.MonacoEditorProps,
  | 'placeholder'
  | 'enabled'
  | 'autoFocus'
  | 'tabSize'
  | 'minimap'
  | 'readOnly'
  | 'fontSize'
  | 'spinning'
  | 'wordWrap'
  | 'wordWrapColumn'
> & { margin?: t.CssEdgesInput; debounce?: t.Msecs };

/**
 * DocumentId sub-props:
 */
export type YamlEditorDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
  storageKey?: t.StringKey;
  urlKey?: t.StringKey;
};
