import type { t } from './common.ts';

/**
 *
 */
export type ClientLoaderLib = { readonly UI: t.FC<ClientLoaderProps> };

/**
 * Component:
 */
export type ClientLoaderProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
