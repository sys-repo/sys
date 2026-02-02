import { type t, Str } from './common.ts';
import { toCanonical } from './u.toCanonical.ts';

export const normalize: t.UrlLib['normalize'] = (input) => {
  const raw = Str.trimEdgeNewlines(String(input ?? '')).trim();
  const canonical = toCanonical(raw);
  const href = canonical.ok ? canonical.href : raw;
  const trimmed = Str.trimTrailingSlashes(href);
  return (trimmed || href) as t.StringUrl;
};
