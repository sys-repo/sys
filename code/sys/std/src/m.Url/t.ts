import type { t } from './common.ts';

/**
 * Helpers for working with HTTP/URL strings.
 */
export type UrlLib = {
  /** Generator function for a new URL helpers instance. */
  parse(base: t.StringUrl | Deno.NetAddr | undefined): t.HttpUrl;
};

/**
 * Represents a URL endpoint of an HTTP service.
 */
export type HttpUrl = {
  /** Flag indicating if the parse was OK - false if there is an error. */
  readonly ok: boolean;

  /** Parse error. */
  readonly error?: t.StdError;

  /** The base URL path. */
  readonly raw: string;

  /** Join parts of a URL path. */
  join(...parts: string[]): string;

  /** Collapse the URL to a simple HREF string. */
  toString(): string;

  /** Snapshot the current value into a URL instance. */
  toURL(): URL;
};
