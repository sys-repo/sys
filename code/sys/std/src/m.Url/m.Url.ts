import { type t, Err, Is, Path } from './common.ts';
import type { UrlLib } from './t.ts';

/**
 * Helpers for a URL used within an HTTP fetch client.
 */
export const Url: UrlLib = {
  parse(base) {
    return Is.netaddr(base) ? wrangle.fromAddr(base) : wrangle.fromUrl(base);
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  asUrl(base: string) {
    base = String(base);
    const invalidBase = `Invalid base URL: ${base ? `"${base}"` : '<empty>'}`;
    try {
      const url = new URL(base);
      if (url.origin === 'null') return { url, error: Err.std(invalidBase) };
      return { url };
    } catch (cause: unknown) {
      const error = Err.std(invalidBase, { cause });
      const url = new URL('about:blank');
      return { url, error };
    }
  },

  fromAddr(base: Deno.NetAddr) {
    return wrangle.fromUrl(`http://${base.hostname}:${base.port}`);
  },

  fromUrl(raw: t.StringUrl | undefined): t.HttpUrl {
    const { url, error } = wrangle.asUrl(raw ?? '');
    return {
      ok: !error,
      raw: error ? String(raw) : url.href,
      error: error,
      join(...parts: string[]) {
        const path = Path.join(url.pathname, ...parts);
        return `${url.origin}/${path.replace(/^\/*/, '')}`;
      },
      toString() {
        return url.href;
      },
      toURL() {
        return new URL(url.toString());
      },
    };
  },
} as const;
