import type { t } from './common.ts';

/**
 * Data structure for modelling a map of origin-urls.
 */
export type HttpOriginDataLib = {
  flatten(input: UrlTree, prefix?: string): readonly UrlRow[];
};

/**
 * Per-environment origin tree map (input to HttpOrigin component).
 */
export type HttpOriginSpecMap<E extends string = string, T extends UrlTree = UrlTree> = Partial<
  Record<E, T>
>;

/**
 * URL value for a single row (supports single or multiple origins).
 */
export type HttpOriginValue = t.StringUrl | readonly t.StringUrl[];

/**
 * A tree structure of urls.
 */
export type UrlTree = t.StringUrl | { readonly [key: string]: UrlTree };
export type UrlRow = {
  readonly key: string; // e.g. "cdn.video"
  readonly url: t.StringUrl;
};
