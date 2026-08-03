import { type t, Url } from '../common.ts';

/** Parse one absolute HTTP(S) resource source without ambient credentials. */
export function parseResourceSource(input: string): URL | undefined {
  if (!input || input !== input.trim()) return;
  try {
    const url = new URL(input);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password
    ) {
      return;
    }
    url.hash = '';
    return url;
  } catch {
    return;
  }
}

/** Remove userinfo, query, and fragment from public resource-source evidence. */
export function safeResourceSource(input: t.StringUrl): t.StringUrl {
  const canonical = Url.toCanonical(input);
  return canonical.ok ? canonical.href : '';
}
