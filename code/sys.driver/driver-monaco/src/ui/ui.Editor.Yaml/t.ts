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
  onDocumentChange?: (e: { doc: t.Crdt.Ref }) => void;
};

/**
 * Signal state to attach values to:
 */
export type YamlEditorSignals = {
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
  doc: t.Signal<t.Crdt.Ref | undefined>;
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
