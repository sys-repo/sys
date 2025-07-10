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
    try {
      const url = new URL(base);
      return { url };
    } catch (cause: unknown) {
      const msg = `Invalid base URL: ${String(base) || '<empty>'}`;
      const error = Err.std(msg, { cause });
      const url = new URL('about:blank');
      return { url, error };
    }
  },

  fromAddr(base: Deno.NetAddr) {
    return wrangle.fromUrl(`http://${base.hostname}:${base.port}`);
  },

  fromUrl(base: t.StringUrl | undefined): t.HttpUrl {
    const { url, error } = wrangle.asUrl(base ?? '');
    base = error ? String(base) : url.href;
    return {
      ok: !error,
      base,
      error: error,
      join(...parts: string[]) {
        const path = Path.join(url.pathname, ...parts);
        return `${url.origin}/${path.replace(/^\/*/, '')}`;
      },
      toString() {
        return base;
      },
      toObject() {
        return new URL(url.toString());
      },
    };
  },
} as const;
