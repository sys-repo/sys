import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleReactProps = {
  factory?: t.Factory;
  plan?: t.Plan<any>;
  strategy?: 'eager' | 'suspense';
  validate?: t.UseFactoryValidateMode | boolean;
  debugDelay?: t.Msecs;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
