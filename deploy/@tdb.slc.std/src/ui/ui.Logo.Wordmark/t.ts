import type { t } from './common.ts';

/**
 * <Component>:
 */
export type LogoWordmarkProps = {
  logo?: t.LogoKind;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onReady?: () => void;
};

/** List of supported logos. */
export type LogoKind = 'SLC' | 'CC';
