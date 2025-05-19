import type { t } from './common.ts';

/**
 * Tools for managing the configuration of a media-stream.
 */
export type MediaConfigLib = {
  readonly Filters: MediaFiltersLib;
  readonly UI: { readonly Slider: React.FC<t.MediaConfigSliderProps> };
};

/**
 * Tools for working with media-stream filters.
 */
export type MediaFiltersLib = {
  readonly config: t.MediaFilterConfigMap;
  readonly UI: { readonly List: React.FC<t.MediaFiltersProps> };

  /** Construct a partial map of filter values. */
  values(filters: t.MediaFilterName[]): Partial<t.MediaFilterValueMap>;

  /** Convert a partial map of filter values → CSS filter string. */
  toString(values?: Partial<t.MediaFilterValueMap>): string;
};

/** Names of visual filters that can be applied to a MediaStream. */
export type MediaFilterName =
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'grayscale'
  | 'sepia'
  | 'hue-rotate'
  | 'invert'
  | 'blur';

/**
 * Map <T> values against filter names.
 */
export type MediaFilterMap<T> = Record<MediaFilterName, T>;

/** A map of filter values. */
export type MediaFilterValueMap = MediaFilterMap<number>;

/** A map of filter configuration settings. */
export type MediaFilterConfigMap = MediaFilterMap<MediaFilterConfig>;
export type MediaFilterConfig = {
  range: t.MinMaxNumberRange;
  unit: string;
  initial: number;
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

/**
 * <Component>: List
 */
export type MediaFiltersProps = {
  debug?: boolean;
  config?: Partial<t.MediaFilterConfigMap>;
  values?: Partial<t.MediaFilterValueMap>;
  debounce?: t.Msecs;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: t.MediaFiltersChangeHandler;
  onChanged?: t.MediaFiltersChangeHandler;
};

/**
 * Event: fires when a single media-filter changes.
 */
export type MediaFilterChangeHandler = (e: MediaFilterChangeArgs) => void;
export type MediaFilterChangeArgs = {
  readonly name: t.MediaFilterName;
  readonly percent: t.Percent;
  readonly value: number;
};

/**
 * Event: fires when a single media-filter changes.
 */
export type MediaFiltersChangeHandler = (e: MediaFiltersChangeArgs) => void;
export type MediaFiltersChangeArgs = {
  readonly change: MediaFilterChangeArgs;
  readonly values: Partial<t.MediaFilterValueMap>;
  readonly filter: string;
};
