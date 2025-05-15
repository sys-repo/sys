import type { t } from './common.ts';

/**
 * Tools for working with media filters.
 */
export type MediaFiltersLib = {
  readonly UI: {
    readonly List: React.FC<t.MediaFiltersProps>;
    readonly Filter: React.FC<t.MediaFilterProps>;
  };
  readonly config: t.MediaFilterConfigMap;
  values(filters: t.MediaFilterName[]): Partial<t.MediaFilterValueMap>;
};

/** Names of visual filters that can be applied to a MediaStream. */
export type MediaFilterName =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'grayscale'
  | 'hue-rotate'
  | 'invert'
  | 'opacity'
  | 'saturate'
  | 'sepia';

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
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { filter: string }) => void;
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
  onChange?: (e: { name: t.MediaFilterName; percent: t.Percent; value: number }) => void;
};
