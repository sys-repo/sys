import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MediaFiltersProps = {
  debug?: boolean;
  onChangeDebounce?: t.Msecs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { filter: string }) => void;
};

export type MediaFilterProps = {
  label: string;
  value?: number;
  unit: string;
  range: t.MinMaxNumberRange;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { percent: t.Percent; value: number }) => void;
};
