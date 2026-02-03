import type { t } from './common.ts';

export type DevLoaderOriginKind = 'local' | 'prod';

/**
 * Loader debug/selection UI.
 */
export type DevLoaderLib = { readonly UI: t.FC<DevLoaderProps> };

/**
 * Component:
 */
export type DevLoaderProps = {
  origin?: t.DevLoaderOriginKind;
  default?: { origin?: { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin } };

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
