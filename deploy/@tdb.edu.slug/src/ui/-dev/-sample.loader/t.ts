import type { t } from './common.ts';

/**
 *
 */
export type SampleLoaderLib = { readonly UI: t.FC<SampleLoaderProps> };

/**
 * Component:
 */
export type SampleLoaderProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
