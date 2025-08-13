import type { t } from './common.ts';

/**
 * Component:
 */
export type FooterProps = {
  repo?: t.Crdt.Repo;
  yaml?: t.EditorYaml;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
