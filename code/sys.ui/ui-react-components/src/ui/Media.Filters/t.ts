import type { t } from './common.ts';

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
  onChangeDebounce?: t.Msecs;
  include?: t.MediaFilterName[];
  config?: Partial<t.MediaFilterConfigMap>;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { filter: string }) => void;
};

/**
 * <Component>: Single
 */
export type MediaFilterProps = {
  debug?: boolean;
  label: string;
  value?: number;
  unit: string;
  range: t.MinMaxNumberRange;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { percent: t.Percent; value: number }) => void;
};
