import type { t } from './common.ts';

export type FiltersProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { filter: string }) => void;
};

export type FilterProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  unit: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { percent: t.Percent; value: number }) => void;
};
