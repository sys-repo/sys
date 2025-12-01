import { type t } from './common.ts';
import { parse } from './u.parse.ts';
import { toCanonical } from './u.toCanonical.ts';

/**
 * Helpers for a URL used within an HTTP fetch client.
 */
export const Url: t.UrlLib = {
  parse,
  toCanonical,
} as const;
