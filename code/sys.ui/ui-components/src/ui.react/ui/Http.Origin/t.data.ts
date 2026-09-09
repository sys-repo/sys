import type { t } from './common.ts';

/** Data helpers for flattening HTTP origin URL trees. */
export type HttpOriginDataLib = {
  /** Flatten a nested URL tree into dot-path rows. */
  flatten(input: UrlTree, prefix?: string): readonly UrlRow[];
};

/** URL value for a single origin row or origin group. */
export type HttpOriginValue = t.StringUrl | readonly t.StringUrl[];

/** URL tree keyed by origin path segments. */
export type UrlTree = t.StringUrl | { readonly [key: string]: UrlTree };

/** Flattened origin URL row emitted from a URL tree. */
export type UrlRow = {
  /** Dot-path key within the source URL tree. */
  readonly key: string; // e.g. "cdn.video"
  /** URL value resolved for the row key. */
  readonly url: t.StringUrl;
};
