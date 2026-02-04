import type { t } from './common.ts';

/**
 * Slug url-endpoint origins.
 */
export type SlugHttpOriginsSpecMap = t.HttpOriginSpecMap<t.HttpOriginEnv, t.SlugHttpOrigins>;
export type SlugHttpOrigins = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

/**
 * Visual helpers for selecting and working with the url-enpoint origins.
 */
export type SlugHttpOriginLib = {
  readonly UI: t.FC<SlugHttpOriginProps>;
  readonly origins: t.SlugHttpOriginsSpecMap;
};

/**
 * Component:
 */
export type SlugHttpOriginProps = {
  env?: t.SignalOptional<t.HttpOriginEnv>;
  origin?: t.SignalOptional<t.SlugHttpOrigins>;
  spec?: t.SlugHttpOriginsSpecMap;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
