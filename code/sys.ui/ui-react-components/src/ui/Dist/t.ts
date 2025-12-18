import type { t } from './common.ts';

/**
 * UI components for working with `dist.json` standard structure.
 */
export type DistLib = {
  readonly UI: t.FC<DistProps>;
};

/**
 * Component:
 */
export type DistProps = {
  dist?: t.DistPkg;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
