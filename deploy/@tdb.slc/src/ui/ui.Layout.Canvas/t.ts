import type { t } from './common.ts';

type Content = JSX.Element | t.ReactNode;

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
export type CanvasPanelContentMap = t.CanvasPanelPartialMap<CanvasPanelContent>;
export type CanvasPanelContent = { el?: Content | (() => Content) };
