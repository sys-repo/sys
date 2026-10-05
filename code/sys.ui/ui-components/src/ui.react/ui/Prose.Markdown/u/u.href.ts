import { Is, Str, type t, Url } from '../common.ts';

export function toSafeHref(input: unknown): t.StringUri | undefined {
  if (!Is.string(input)) return;

  const href = Str.trimEdgeNewlines(input).trim();
  if (!href) return;
  if (href.startsWith('//')) return;

  if (href.startsWith('#')) return href;
  if (href.startsWith('/')) return href;
  if (href.startsWith('./') || href.startsWith('../')) return href;

  const lower = href.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return href;

  const parsed = Url.parse(href);
  if (!parsed.ok) return;

  const protocol = parsed.toURL().protocol.toLowerCase();
  return protocol === 'http:' || protocol === 'https:' ? href : undefined;
}
