import type { t } from './common.ts';

/**
 * <Component>:
 */
export type LogoWordmarkProps = {
  logo?: t.LogoKind;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** List of supported logos. */
export type LogoKind = 'SLC' | 'CreativeCommons';
