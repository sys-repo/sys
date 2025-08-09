import type { t } from './common.ts';

/**
 * <Component>:
 */
export type EditorCanvasProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  borderRadius?: t.Pixels;

  // Debug:
  debug?: boolean;
  debugSize?: t.CanvasLayoutProps['debugSize'];
};
