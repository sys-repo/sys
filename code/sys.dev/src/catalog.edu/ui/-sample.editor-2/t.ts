import type { t } from './common.ts';

/**
 * Component:
 */
export type Sample2Props = {
  repo: t.Crdt.Repo;
  wordWrap?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
