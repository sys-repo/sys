import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleProps = {
  repo?: t.Crdt.Repo;
  path?: t.ObjectPath;
  signals?: Partial<t.YamlEditorSignals>;
  localstorage?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
