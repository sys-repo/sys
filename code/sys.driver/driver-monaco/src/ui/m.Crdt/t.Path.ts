import { type t } from './common.ts';

/**
 * Component:
 */
export type PathViewProps = {
  path?: t.ObjectPath;
  prefixColor?: string;
  prefix?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
