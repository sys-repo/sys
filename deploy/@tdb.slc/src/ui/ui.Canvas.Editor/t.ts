import type { t } from './common.ts';

/**
 * <Component>:
 */
export type EditorCanvasProps = {
  doc?: t.CrdtRef;
  panels?: t.CanvasPanelContentMap;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Debug:
  debug?: boolean;
  debugSize?: t.CanvasLayoutProps['debugSize'];
};
