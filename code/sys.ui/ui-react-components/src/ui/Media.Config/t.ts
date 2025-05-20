import type { t } from './common.ts';
export type * from './t.Config.Filters.ts';
export type * from './t.Config.Zoom.ts';

/**
 * Tools for managing the configuration of a media-stream.
 */
export type MediaConfigLib = {
  readonly UI: { readonly Slider: React.FC<t.MediaConfigSliderProps> };
  readonly Filters: t.MediaFiltersLib;
  readonly Zoom: t.MediaZoomLib;
};

/**
 * <Component>: Single configuration slider.
 */
export type MediaConfigSliderProps = {
  debug?: boolean;
  label?: string;
  value?: number;
  unit: string;
  range: t.MinMaxNumberRange;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.MediaSliderChangeHandler;
};

/**
 * Event: fires when a single media-filter changes.
 */
export type MediaSliderChangeHandler = (e: MediaSliderChangeArgs) => void;
export type MediaSliderChangeArgs = {
  readonly label: string;
  readonly percent: t.Percent;
  readonly value: number;
};
