import type { t } from './common.ts';

/**
 * <Component>:
 */
export type FadeElementProps = {
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

/** Internal state on an item within the <FadeElement>. */
export type FadeElementItem = { id: number; text: string; fadingOut: boolean };
