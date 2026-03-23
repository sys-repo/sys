import type { t } from './common.ts';

/**
 * Slug url-endpoint origins.
 */
export type SlugHttpOriginsSpecMap = t.HttpOriginSpecMap<t.HttpOrigin.Env, t.SlugUrlOrigin>;

/**
 * Visual helpers for selecting and working with the url-enpoint origins.
 */
export type SlugHttpOriginLib = {
  readonly UI: t.FC<SlugHttpOriginProps>;
  readonly Origin: t.SlugLoaderLib['Origin'];
  readonly Default: { readonly spec: t.SlugHttpOriginsSpecMap };
};

/**
 * Component:
 */
export type SlugHttpOriginProps = {
  env?: t.SignalOptional<t.HttpOrigin.Env>;
  origin?: t.SignalOptional<t.SlugUrlOrigin>;
  spec?: t.SlugHttpOriginsSpecMap;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
