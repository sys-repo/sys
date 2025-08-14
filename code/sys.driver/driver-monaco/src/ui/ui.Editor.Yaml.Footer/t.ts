import type { t } from './common.ts';

/**
 * Component:
 */
export type YamlEditorFooterProps = {
  visible?: boolean;
  path?: t.ObjectPath;
  crdt?: YamlEditorFooterCrdt;
  errors?: t.YamlError[];

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** Footer CRDT/Repo sub-properties. */
export type YamlEditorFooterCrdt = {
  visible?: boolean;
  repo?: t.Crdt.Repo;
  localstorage?: t.StringKey;
};
