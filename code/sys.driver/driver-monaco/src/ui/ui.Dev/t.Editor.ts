import type { t } from './common.ts';

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  signals?: Partial<t.DevEditorSignals>;
  localstorage?: t.StringKey;
  editor?: DevEditorMonacoProps;
  path?: t.ObjectPath;

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
