import type { t } from './common.ts';

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  signals?: t.DevEditorSignals;
  localstorage?: t.StringKey;
  editor?: DevEditorEditorProps;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: t.MonacoEditorProps['onReady'];
};

/** Signal state to attach values to: */
export type DevEditorSignals = {
  doc?: t.Signal<t.Crdt.Ref>;
  monaco?: t.Signal<t.Monaco.Monaco | undefined>;
  editor?: t.Signal<t.Monaco.Editor | undefined>;
};

/** Editor sub-props: */
export type DevEditorEditorProps = Pick<
  t.MonacoEditorProps,
  'language' | 'autoFocus' | 'tabSize' | 'minimap' | 'readOnly' | 'placeholder'
> & {
  margin?: t.CssEdgesInput;
};
