import type { t } from './common.ts';
type M = React.MouseEventHandler<HTMLDivElement>;

export type SheetDirection = 'Bottom:Up' | 'Top:Down';

/**
 * <Component>:
 */
export type SheetProps = {
  children?: t.ReactNode;
  radius?: t.Pixels;
  direction?: t.SheetDirection;

  duration?: t.Secs;
  bounce?: number;
  shadowOpacity?: t.Percent;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onClick?: M;
  onDoubleClick?: M;
  onMouseDown?: M;
  onMouseUp?: M;
  onMouseEnter?: M;
  onMouseLeave?: M;
};
