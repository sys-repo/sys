import type { t } from './common.ts';

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  signals?: { doc?: t.Signal<t.Crdt.Ref> };
  localstorage?: t.StringKey;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
