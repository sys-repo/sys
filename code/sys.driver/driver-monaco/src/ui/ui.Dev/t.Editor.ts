import type { t } from './common.ts';

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  localstorage?: t.StringKey;
  signals?: Partial<t.DevEditorSignals>;

  path?: t.ObjectPath;
  docid?: t.DevEditorDocumentIdProps;
  editor?: t.DevEditorMonacoProps;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.MonacoEditorProps['onReady'];
  onDocumentChange?: (e: { doc: t.Crdt.Ref }) => void;
};

/** Signal state to attach values to: */
export type DevEditorSignals = {
  doc: t.Signal<t.Crdt.Ref | undefined>;
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
};

/** Editor sub-props: */
export type DevEditorMonacoProps = Pick<
  t.MonacoEditorProps,
  'autoFocus' | 'tabSize' | 'minimap' | 'readOnly' | 'placeholder'
> & {
  margin?: t.CssEdgesInput;
};

/** DocumentId sub-props: */
export type DevEditorDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
};
