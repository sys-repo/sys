import type { t } from './common.ts';

/**
 * Component:
 */
export type YamlEditorFooterProps = {
  visible?: boolean;
  path?: t.ObjectPath;
  crdt?: { repo?: t.Crdt.Repo; localstorage?: t.StringKey };
  errors?: t.YamlError[];

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
