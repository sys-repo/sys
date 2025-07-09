import { type t, Is, Path } from './common.ts';
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
    } catch (_err: unknown) {
      const error = new Error(`Invalid base URL: ${String(base)}`);
      return { error };
    }
  },

  fromUrl(base: t.StringUrl) {
    const { url, error } = wrangle.asUrl(base);
    if (error) throw error;
    base = url.href;
    const api: t.HttpUrl = {
      base,
      join(...parts: string[]) {
        const path = Path.join(url.pathname, ...parts);
        return `${url.origin}/${path.replace(/^\/*/, '')}`;
      },
      toString() {
        return base;
      },
      toObject() {
        return new URL(api.toString());
      },
    };
    return api;
  },

  fromAddr(base: Deno.NetAddr) {
    return wrangle.fromUrl(`http://${base.hostname}:${base.port}`);
  },
} as const;
