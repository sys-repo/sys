import type { t } from './common.ts';

/**
 * Component:
 */
export type TimestampsProps = {
  timestamps?: t.TimeMap;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
