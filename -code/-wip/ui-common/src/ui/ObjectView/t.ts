import type { t } from '../common.ts';

export type ObjectViewProps = {
  name?: string;
  data?: any;
  expand?: number | { level?: number; paths?: string[] | boolean };
  format?: boolean | t.ObjectViewFormatter;

  showNonenumerable?: boolean;
  showRootSummary?: boolean;
  sortObjectKeys?: boolean;
  fontSize?: number;
  theme?: t.CommonTheme;
  margin?: t.CssMarginInput;
  style?: t.CssValue;
};

export type ObjectViewFormatter = (data: object | any[]) => void;
