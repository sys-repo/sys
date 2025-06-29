import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasProjectProps = {
  doc?: t.CrdtRef;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onCanvasClick?: React.MouseEventHandler;
};
