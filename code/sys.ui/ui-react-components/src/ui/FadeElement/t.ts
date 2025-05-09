import type { t } from './common.ts';

/**
 * <Component>:
 */
export type FadeElementProps = {
  children?: t.ReactNode;
  duration?: t.Msecs;
  style?: t.CssInput;
};
