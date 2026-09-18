import { type t } from './common.ts';

/** Read-only CRDT repo status panel props. */
export type Props = {
  repo?: t.Crdt.Repo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** Small indicator dot showing the repo's current connectivity state. */
export type StatusBulletProps = {
  repo?: t.Crdt.Repo;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
