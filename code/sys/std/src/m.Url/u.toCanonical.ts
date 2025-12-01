import { type t } from './common.ts';
import { parse } from './u.parse.ts';

export const toCanonical: t.UrlLib['toCanonical'] = (input) => {
  // Normalize everything into a string href so we always feed parse().
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.href; // input is t.HttpUrl
  const parsed = parse(href);
  if (!parsed.ok) return parsed; // failed HttpUrl

  const url = parsed.toURL();

  // Strip query + hash.
  url.search = '';
  url.hash = '';

  const canonicalHref = url.origin + url.pathname;

  // Return a fresh canonical HttpUrl wrapper.
  return parse(canonicalHref);
};
