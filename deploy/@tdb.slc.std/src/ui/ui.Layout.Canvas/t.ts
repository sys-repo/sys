import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CanvasLayoutProps = {
  panels?: t.CanvasPanelContentMap;

  // Debug:
  debug?: boolean;
  debugSize?: { style?: t.CssInput };

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  borderWidth?: t.Pixels;
};

/**
 * Map of content to render into panels.
 */
export type CanvasPanelContentMap = t.CanvasPanelPartialMap<CanvasPanelContentOrNode>;
export type CanvasPanelContentOrNode = CanvasPanelContent | string;
export type CanvasPanelContent = { view?: React.JSX.Element | string };
