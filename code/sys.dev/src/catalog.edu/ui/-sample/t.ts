import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleEduProps = {
  repo?: t.Crdt.Repo;
  path?: t.ObjectPath;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
