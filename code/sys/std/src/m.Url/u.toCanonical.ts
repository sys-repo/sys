import { type t } from './common.ts';
import { parse } from './u.parse.ts';

export const toCanonical: t.UrlLib['toCanonical'] = (input) => {
  let href = '';

  if (typeof input === 'string') {
    href = input;
  } else if (input instanceof URL) {
    href = input.href;
  } else if (input && 'href' in input) {
    // t.HttpUrl case
    href = input.href as string;
  }

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
