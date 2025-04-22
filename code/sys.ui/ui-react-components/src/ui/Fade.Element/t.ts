import type { t } from './common.ts';

/**
 * <Component>:
 */
export type FadeElementProps = {
  children?: t.ReactNode;
  duration?: t.Msecs;
  style?: t.CssInput;
};

/** Internal state on an item within the <FadeElement>. */
export type FadeElementItem = {
  id: number;
  children: t.ReactNode;
  key: t.ReactChildrenDepsKey;
  fadingOut: boolean;
};
