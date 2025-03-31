import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ObjProp = {
  name?: string;
  data?: any;

  fontSize?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
