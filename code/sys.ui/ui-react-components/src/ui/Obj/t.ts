import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ObjProps = {
  name?: string;
  data?: any;

  show?: Partial<ObjShow>;
  block?: boolean;
  fontSize?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Object show feature flags.
 */
export type ObjShow = {
  nonenumerable: boolean;
  rootSummary: boolean;
};
