import type { t } from './common.ts';

/**
 * Component:
 */
export type PathViewProps = {
  path?: t.ObjectPath;
  prefix?: string;

  prefixColor?: string;
  maxSegmentLength?: number;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
