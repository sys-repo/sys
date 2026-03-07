import { type t } from './common.ts';
import { normalize } from './u.normalize.ts';
import { parse } from './u.parse.ts';
import { toCanonical } from './u.toCanonical.ts';

/**
 * Helpers for a URL used within an HTTP fetch client.
 */
export const Url: t.UrlLib = {
  normalize,
  parse,
  toCanonical,
} as const;
