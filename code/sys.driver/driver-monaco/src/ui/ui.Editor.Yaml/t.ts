import type { t } from './common.ts';

/**
 * Component:
 */
export type YamlEditorProps = {
  repo?: t.Crdt.Repo;
  signals?: Partial<t.YamlEditorSignals>;
  path?: t.ObjectPath;

  documentId?: t.YamlEditorDocumentIdProps;
  editor?: t.YamlEditorMonacoProps;
  footer?: t.YamlEditorFooterProps;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.MonacoEditorProps['onReady'];
  onDocumentLoaded?: t.YamlEditorDocumentLoadedHandler;
};

/** Fires when a new document (crdt) is loaded into the editor. */
export type YamlEditorDocumentLoadedHandler = (e: YamlEditorDocumentLoaded) => void;
export type YamlEditorDocumentLoaded = {
  doc: t.Crdt.Ref;
  events: t.Crdt.Events;
  dispose$: t.DisposeObservable;
};

/**
 * State wrapped in signals.
 */
export type YamlEditorSignals = {
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
  doc: t.Signal<t.Crdt.Ref | undefined>;
  yaml: t.Signal<t.EditorYaml | undefined>;
};

/**
 * Editor sub-props:
 */
export type YamlEditorMonacoProps = Pick<
  t.MonacoEditorProps,
  'autoFocus' | 'tabSize' | 'minimap' | 'readOnly' | 'placeholder'
> & {
  margin?: t.CssEdgesInput;
};

/**
 * DocumentId sub-props:
 */
export type YamlEditorDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
  localstorage?: t.StringKey;
  urlKey?: t.StringKey;
};

/**
 * FooterBar sub-props:
 */
export type YamlEditorFooterProps = {
  visible?: boolean;
};
