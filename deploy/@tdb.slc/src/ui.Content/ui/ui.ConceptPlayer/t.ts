import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  column?: t.HGridColumnProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
