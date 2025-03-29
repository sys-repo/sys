import type { t } from './common.ts';

type M = React.MouseEventHandler<HTMLDivElement>;

/**
 * <Component>:
 */
export type MobileSheetProps = {
  children?: t.ReactNode;
  duration?: t.Secs;
  radius?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: M;
  onMouseDown?: M;
  onMouseUp?: M;
  onMouseEnter?: M;
  onMouseLeave?: M;
};
