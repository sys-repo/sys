import type { t } from './common.ts';

type M = React.MouseEventHandler<HTMLDivElement>;

/**
 * <Component>:
 */
export type SheetProps = {
  children?: t.ReactNode;
  radius?: t.Pixels;
  duration?: t.Secs;
  bounce?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: M;
  onDoubleClick?: M;
  onMouseDown?: M;
  onMouseUp?: M;
  onMouseEnter?: M;
  onMouseLeave?: M;
};
