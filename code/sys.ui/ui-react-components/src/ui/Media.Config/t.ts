import type { t } from './common.ts';
export type * from './t.Filters.ts';

/**
 * Tools for managing the configuration of a media-stream.
 */
export type MediaConfigLib = {
  readonly UI: { readonly Slider: React.FC<t.MediaConfigSliderProps> };
  readonly Filters: t.MediaFiltersLib;
};

/**
 * <Component>: Single configuration slider.
 */
export type MediaConfigSliderProps = {
  debug?: boolean;
  name: t.MediaFilterName;
  label?: string;
  value?: number;
  unit: string;
  range: t.MinMaxNumberRange;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.MediaFilterChangeHandler;
};
