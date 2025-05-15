import type { t } from './common.ts';

export type FiltersProps = {
  onChangeDebounce?: t.Msecs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { filter: string }) => void;
};

export type FilterProps = {
  label: string;
  value?: number;
  unit: string;
  range: t.MinMaxNumberRange;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { percent: t.Percent; value: number }) => void;
};
