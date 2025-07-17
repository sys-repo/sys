import { type t } from './common.ts';

/**
 * Component:
 */
export type PathViewProps = {
  path?: t.ObjectPath;
  prefix?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
