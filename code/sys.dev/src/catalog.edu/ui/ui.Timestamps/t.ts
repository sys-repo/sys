import type { t } from './common.ts';

/**
 * Component:
 */
export type TimestampsProps = {
  timestamps?: t.Timestamps;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
