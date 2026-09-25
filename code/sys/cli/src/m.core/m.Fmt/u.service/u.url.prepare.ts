import { type t, Url } from '../common.ts';

type UrlText = {
  readonly href: string;
  readonly protocol: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly highlightOrigin: boolean;
};
export type ServiceUrlAdmission = {
  readonly check: (length: number) => void;
  readonly compose?: typeof composeUrlPart;
};

/**
 * Prepare URLs in input order, highlighting the first occurrence of each displayed origin.
 * Each call starts a new list; origins from earlier calls do not affect it.
 */
export function parts(
  urls: Iterable<t.Service.Url>,
  options: t.CliFormat.ServiceUrl.Parts.Options,
  admission?: ServiceUrlAdmission,
): readonly t.CliFormat.ServiceUrl.Part[] {
  const origins = new Set<string>();
  const result: t.CliFormat.ServiceUrl.Part[] = [];
  let index = 0;

  for (const url of urls) {
    const current = prepare(url, options, false, admission);
    const origin = current.ok ? current.origin : undefined;
    const highlightOrigin = origin ? !origins.has(origin) : index === 0;
    if (origin) origins.add(origin);
    result.push({ ...current, highlightOrigin });
    index += 1;
  }

  return Object.freeze(result);
}

/**
 * Split a URL into display parts while retaining its original href.
 * Unparseable text is returned unchanged for the caller to display.
 */
export function prepare(
  url: t.Service.Url,
  options: t.CliFormat.ServiceUrl.Parts.Options,
  highlightOrigin: boolean,
  admission?: ServiceUrlAdmission,
): t.CliFormat.ServiceUrl.Part {
  const parsed = Url.parse(url.href);
  if (!parsed.ok) {
    return Object.freeze({
      ok: false,
      href: url.href,
      origin: url.href,
      suffix: '',
      display: url.href,
      highlightOrigin,
    });
  }

  const value = parsed.toURL();
  const text: UrlText = {
    href: url.href,
    protocol: value.protocol,
    hostname: displayHostname(value.hostname, options),
    port: value.port,
    pathname: value.pathname,
    search: value.search,
    hash: value.hash,
    highlightOrigin,
  };
  const portLength = text.port ? text.port.length + 1 : 0;
  const originLength = text.protocol.length + 2 + text.hostname.length + portLength;
  const suffixLength = text.pathname.length + text.search.length + text.hash.length || 1;
  admission?.check(originLength + suffixLength);
  const compose = admission?.compose ?? composeUrlPart;
  return compose(text);
}

/** Internal URL-display composition seam; standalone ServiceUrl does not impose service budgets. */
export function composeUrlPart(text: UrlText): t.CliFormat.ServiceUrl.Part {
  const host = text.port ? `${text.hostname}:${text.port}` : text.hostname;
  const origin = `${text.protocol}//${host}`;
  const suffix = `${text.pathname}${text.search}${text.hash}` || '/';
  return Object.freeze({
    ok: true,
    href: text.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    highlightOrigin: text.highlightOrigin,
    ...(text.port ? { port: text.port } : {}),
  });
}

/**
 * Display `127.0.0.1` as `localhost`, unless `ipv4Loopback` is `exact`.
 */
export function displayHostname(
  hostname: t.StringHostname,
  options: t.CliFormat.ServiceUrl.DisplayHostname.Options = {},
): t.StringHostname {
  const exact = options.ipv4Loopback === 'exact';
  return !exact && hostname === '127.0.0.1' ? 'localhost' : hostname;
}
