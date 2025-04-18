import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasSlugProps = {
  selected?: t.CanvasPanel | t.CanvasPanel[];
  logo?: t.LogoKind;
  text?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
