import type { t } from './common.ts';

/**
 * Library: tools for zooming and panning within a MediaStream.
 */
export type MediaZoomLib = {
  readonly UI: {
    readonly Sliders: React.FC<t.MediaZoomSlidersProps>;
  };
};

/**
 * <Component>:
 */
export type MediaZoomSlidersProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
