import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasProjectProps = {
  doc?: t.Crdt.Ref;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onCanvasClick?: React.MouseEventHandler;
};
