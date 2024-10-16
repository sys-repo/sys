import type { t } from './common.ts';

type Color = string | number;
type Size = { width: number; height: number };

export type DevBackgroundImageSize = 'cover' | 'fill';
export type DevBackgroundImage = {
  url: string;
  size?: DevBackgroundImageSize;
  opacity?: number;
  margin?: t.CssMarginArray;
};
export type DevBackgroundImageInput = Omit<DevBackgroundImage, 'margin'> & {
  margin?: t.CssMarginInput;
};

/**
 * Rendering state produced by the props.
 */
export type DevRenderProps = {
  subject: DevRenderPropsSubject;
  host: DevRenderPropsHost;
  debug: DevRenderPropsDebug;
  size: DevRenderedSize;
};

export type DevRenderedSize = {
  harness: Size;
  host: Size;
  subject: Size;
  debug: Size;
};

/**
 * Main Component ("Subject")
 */
export type DevRenderPropsSubject = {
  renderer?: t.DevRendererRef<any>;
  size?: DevRenderSize;
  display?: t.DevPropDisplay;
  backgroundColor?: Color;
  color?: Color;
};

/**
 * Component Host ("Harness")
 */
export type DevRenderPropsHost = {
  backgroundColor?: Color;
  color?: Color;
  backgroundImage?: DevBackgroundImage;
  tracelineColor?: Color;
  header: DevRenderPropsEdge;
  footer: DevRenderPropsEdge;
  layers: DevRenderPropsLayers;
};

/**
 * Debug Panel
 */
export type DevRenderPropsDebug = {
  width?: number | null;
  header: DevRenderPropsEdge;
  footer: DevRenderPropsEdge;
  body: {
    renderers: t.DevRendererRef<any>[];
    padding: t.CssPaddingArray;
    scroll: boolean;
  };
};

export type DevRenderPropsEdge = {
  renderer?: t.DevRendererRef<any>;
  border: { color?: Color };
  padding: t.CssPaddingArray;
};

export type DevRenderPropsLayers = { [key: string]: DevRenderPropsLayer };
export type DevRenderPropsLayer = {
  index: number;
  renderer?: t.DevRendererRef<any>;
};

/**
 * Size
 */
export type DevRenderSize = DevRenderSizeCenter | DevRenderSizeFill;
export type DevRenderSizeCenter = {
  mode: 'center';
  width?: number;
  height?: number;
};
export type DevRenderSizeFill = {
  mode: 'fill';
  x: boolean;
  y: boolean;
  margin: t.CssMarginArray;
};
