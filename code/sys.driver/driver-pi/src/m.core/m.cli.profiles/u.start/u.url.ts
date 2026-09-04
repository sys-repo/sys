import { Fs, type t } from './common.ts';

export type CapturedUrl = Readonly<{
  href: t.StringUrl;
  origin: t.StringUrl;
  protocol: string;
  hostname: string;
  host: string;
  port: string;
  username: string;
  password: string;
  pathname: string;
  search: string;
  hash: string;
}>;

/** Parse and copy one URL for later policy and presentation use. */
export function captureUrl(input: string): CapturedUrl | undefined {
  try {
    return captureNativeUrl(new URL(input));
  } catch {
    return;
  }
}

/** Copy the URL fields used by Driver Pi. */
export function captureNativeUrl(url: URL): CapturedUrl {
  return Object.freeze({
    href: url.href as t.StringUrl,
    origin: url.origin as t.StringUrl,
    protocol: url.protocol,
    hostname: url.hostname,
    host: url.host,
    port: url.port,
    username: url.username,
    password: url.password,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  });
}

/** Convert one exact absolute path into a copied file-URL href. */
export function captureFileHref(input: t.StringAbsoluteDir): t.StringUrl | undefined {
  try {
    const url = Fs.Path.toFileUrl(input);
    if (
      url.protocol !== 'file:' || url.search || url.hash ||
      Fs.Path.fromFileUrl(url) !== input
    ) return;
    return url.href as t.StringUrl;
  } catch {
    return;
  }
}

/** Build one URL for terminal hyperlink presentation. */
export function stableNativeUrl(input: string): URL | undefined {
  try {
    return new URL(input);
  } catch {
    return;
  }
}
