import { type t, Is } from './common.ts';

/**
 * Normalise any UrlLike input into a concrete URL instance.
 */
export function toUrl(input: t.UrlLike): URL {
  if (input instanceof URL) return input;
  const any = input as { href?: string; toURL?: () => URL };

  if (Is.func(any.toURL)) {
    const url = any.toURL();
    if (url instanceof URL) return url;
    return new URL(String(url));
  }

  return new URL(String(any.href));
}
