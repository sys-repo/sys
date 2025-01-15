import { type t, Is, Path } from './common.ts';

/**
 * Helpers for a URL used within an HTTP fetch client.
 */
export const Url: t.UrlLib = {
  /**
   * URL factory.
   */
  create(base) {
    return Is.netaddr(base) ? Url.fromAddr(base) : Url.fromUrl(base);
  },

  /**
   * Create from a URL.
   */
  fromUrl(base) {
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
    };
    return api;
  },

  /**
   * Create from a [NetAddr]
   */
  fromAddr(base: Deno.NetAddr) {
    return Url.fromUrl(`http://${base.hostname}:${base.port}`);
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
} as const;
