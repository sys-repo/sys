import { type t, Url } from '../common.ts';

export function parts(
  urls: Iterable<t.Service.Url>,
  options: t.CliFormat.ServiceUrl.Parts.Options,
): readonly t.CliFormat.ServiceUrl.Part[] {
  const origins = new Set<string>();
  const result: t.CliFormat.ServiceUrl.Part[] = [];
  let index = 0;

  for (const url of urls) {
    const current = prepare(url, options, false);
    const origin = current.ok ? current.origin : undefined;
    const highlightOrigin = origin ? !origins.has(origin) : index === 0;
    if (origin) origins.add(origin);
    result.push({ ...current, highlightOrigin });
    index += 1;
  }

  return Object.freeze(result);
}

export function prepare(
  url: t.Service.Url,
  options: t.CliFormat.ServiceUrl.Parts.Options,
  highlightOrigin: boolean,
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
  const origin = displayOrigin(value, options);
  const suffix = formatSuffix(value);
  return Object.freeze({
    ok: true,
    href: url.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    highlightOrigin,
    ...(value.port ? { port: value.port } : {}),
  });
}

function formatSuffix(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}` || '/';
}

function displayOrigin(url: URL, options: t.CliFormat.ServiceUrl.Parts.Options): string {
  return `${url.protocol}//${displayHost(url, options)}`;
}

function displayHost(url: URL, options: t.CliFormat.ServiceUrl.Parts.Options): string {
  const hostname = displayHostname(url, options);
  return url.port ? `${hostname}:${url.port}` : hostname;
}

function displayHostname(url: URL, options: t.CliFormat.ServiceUrl.Parts.Options): string {
  const exact = options.ipv4Loopback === 'exact';
  return !exact && url.hostname === '127.0.0.1' ? 'localhost' : url.hostname;
}
