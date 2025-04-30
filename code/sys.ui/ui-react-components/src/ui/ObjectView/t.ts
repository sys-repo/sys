import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ObjectViewProps = {
  name?: string;
  data?: any;

  show?: Partial<ObjectViewShow>;
  expand?: number | ObjectViewExpand | string[];
  sortKeys?: boolean;

  block?: boolean;
  fontSize?: number;
  theme?: t.CommonTheme;
  margin?: t.CssMarginInput;
  style?: t.CssInput;
};

/**
 * Object show feature flags.
 */
export type ObjectViewShow = {
  nonenumerable: boolean;
  rootSummary: boolean;
};

export type ObjectViewExpand = {
  level?: number;
  paths?: string[] | boolean;
};
