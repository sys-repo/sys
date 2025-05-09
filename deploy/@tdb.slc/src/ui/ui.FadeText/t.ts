import type { t } from './common.ts';

/**
 * <Component>:
 */
export type FadeTextProps = {
  text?: string;
  duration?: t.Msecs;

  // Style:
  fontSize?: t.CssProps['fontSize'];
  fontWeight?: t.CssProps['fontWeight'];
  lineHeight?: t.CssProps['lineHeight'];
  letterSpacing?: t.CssProps['letterSpacing'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
