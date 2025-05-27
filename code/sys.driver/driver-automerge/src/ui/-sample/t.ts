import type { t } from './common.ts';

/**
 * <Component>:
 */
export type SampleProps = {
  doc?: any;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Sample Data:
 */
export type SampleDoc = {
  cards: SampleCard[];
  count: number;
  msg?: string;
};
export type SampleCard = { title: string };
