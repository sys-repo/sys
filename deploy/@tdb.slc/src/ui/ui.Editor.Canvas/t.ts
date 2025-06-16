import type { t } from './common.ts';

/**
 * <Component>:
 */
export type EditorCanvasProps = {
  debug?: boolean;
  doc?: t.CrdtRef;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
