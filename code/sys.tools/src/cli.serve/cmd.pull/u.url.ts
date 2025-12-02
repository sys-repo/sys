import { Url, Is } from '../common.ts';

export function toDistUrl(input?: string): URL | undefined {
  const parsed = Url.parse(input);
  if (!parsed.ok) return undefined;

  const url = parsed.toURL();
  let p = url.pathname;

  if (p.endsWith('/dist.json')) {
    // already correct
  } else if (p.endsWith('/')) {
    p = p + 'dist.json';
  } else {
    p = p + '/dist.json';
  }

  url.pathname = p;
  return url;
}
