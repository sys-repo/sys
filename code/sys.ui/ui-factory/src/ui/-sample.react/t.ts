import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleReactProps = {
  factory?: t.ReactFactory<any, any>;
  plan?: t.Plan<any>;
  strategy?: 'eager' | 'suspense';

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
