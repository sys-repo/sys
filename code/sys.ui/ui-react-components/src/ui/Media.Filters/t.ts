import type { t } from './common.ts';

/**
 * Tools for working with media filters.
 */
export type MediaFiltersLib = {
  readonly config: t.MediaFilterConfigMap;
  readonly UI: {
    readonly List: React.FC<t.MediaFiltersProps>;
    readonly Filter: React.FC<t.MediaFilterProps>;
  };

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
  | 'opacity'
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
};

/**
 * <Component>: Single
 */
export type MediaFilterProps = {
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
 * Event: fires when a single media-filter changes.
 */
export type MediaFilterChangeHandler = (e: MediaFilterChangeHandlerArgs) => void;
export type MediaFilterChangeHandlerArgs = {
  readonly name: t.MediaFilterName;
  readonly percent: t.Percent;
  readonly value: number;
};

/**
 * Event: fires when a single media-filter changes.
 */
export type MediaFiltersChangeHandler = (e: MediaFiltersChangeHandlerArgs) => void;
export type MediaFiltersChangeHandlerArgs = {
  readonly item: MediaFilterChangeHandlerArgs;
  readonly filter: string;
};
