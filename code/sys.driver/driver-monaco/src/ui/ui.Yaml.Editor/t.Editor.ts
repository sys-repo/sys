import type { t } from './common.ts';

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  signals?: Partial<t.DevEditorSignals>;
  path?: t.ObjectPath;

  documentId?: t.DevEditorDocumentIdProps;
  editor?: t.DevEditorMonacoProps;
  footer?: t.DevEditorFooterProps;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.MonacoEditorProps['onReady'];
  onDocumentChange?: (e: { doc: t.Crdt.Ref }) => void;
};

/** Signal state to attach values to: */
export type DevEditorSignals = {
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
  doc: t.Signal<t.Crdt.Ref | undefined>;
};

/**
 * Editor sub-props:
 */
export type DevEditorMonacoProps = Pick<
  t.MonacoEditorProps,
  'autoFocus' | 'tabSize' | 'minimap' | 'readOnly' | 'placeholder'
> & {
  margin?: t.CssEdgesInput;
};

/**
 * DocumentId sub-props:
 */
export type DevEditorDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
  localstorage?: t.StringKey;
  urlKey?: t.StringKey;
};

/**
 * FooterBar sub-props:
 */
export type DevEditorFooterProps = {
  visible?: boolean;
};
