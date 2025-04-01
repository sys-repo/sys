import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ObjProps = {
  name?: string;
  data?: any;

  show?: Partial<ObjShow>;
  sortKeys?: boolean;
  expand?: number | ObjExpand;

  block?: boolean;
  fontSize?: number;
  theme?: t.CommonTheme;
  margin?: t.CssMarginInput;
  style?: t.CssInput;
};

/**
 * Object show feature flags.
 */
export type ObjShow = {
  nonenumerable: boolean;
  rootSummary: boolean;
};

export type ObjExpand = {
  level?: number;
  paths?: string[] | boolean;
};
