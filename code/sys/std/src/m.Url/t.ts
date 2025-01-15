import type { t } from './common.ts';

/**
 * Helpers for working with HTTP/URL strings.
 */
export type UrlLib = {
  /** Generator function for a new URL helpers instance. */
  create(base: t.StringUrl | Deno.NetAddr): t.HttpUrl;

  /** Create URL helpers from a `NetAddr` */
  fromAddr(base: Deno.NetAddr): t.HttpUrl;

  /** Create URL helpers from string. */
  fromUrl(base: t.StringUrl): t.HttpUrl;
};

/**
 * Represents a URL endpoint of an HTTP service.
 */
export type HttpUrl = {
  /** The base URL path. */
  readonly base: string;

  /** Join parts of a URL path. */
  join(...parts: string[]): string;

  /** Collapse the URL to a simple HREF string. */
  toString(): string;
};
