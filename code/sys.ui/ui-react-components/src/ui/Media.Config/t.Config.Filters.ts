import type { t } from './common.ts';

/**
 * Tools for working with media-stream filters.
 */
export type MediaFiltersLib = {
  readonly UI: { readonly List: React.FC<t.MediaFiltersProps> };

  /** A map of the default configuration settings. */
  readonly config: t.MediaFilterConfigMap;

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
 * Event: fires when a single media-filter settings change.
 */
export type MediaFiltersChangeHandler = (e: MediaFiltersChangeArgs) => void;
export type MediaFiltersChangeArgs = {
  readonly change: t.MediaSliderChangeArgs;
  readonly values: Partial<t.MediaFilterValueMap>;
  readonly filter: string;
};
