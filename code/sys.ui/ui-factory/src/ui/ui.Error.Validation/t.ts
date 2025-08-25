import type { t } from './common.ts';

/**
 * Component:
 */
export type ValidationErrorsProps = {
  errors?: readonly t.UseFactoryValidateError[];
  title?: string;
  blur?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
