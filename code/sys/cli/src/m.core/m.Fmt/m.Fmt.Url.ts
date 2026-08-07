import { c, type t, Url } from '../common.ts';

/** CLI formatting helpers for service URLs. */
export const UrlFmt: t.CliFormat.Url.Lib = {
  parts(url) {
    return parts(url);
  },

  serviceParts(urls) {
    const origins = new Set<string>();
    return urls.map((url, index) => {
      const part = parts(url);
      const origin = part.ok ? part.origin : undefined;
      const highlightOrigin = origin ? !origins.has(origin) : index === 0;
      if (origin) origins.add(origin);
      return { ...part, highlightOrigin };
    });
  },

  service(url, options = {}) {
    return formatParts(toParts(url), options.highlightOrigin === true);
  },

  serviceList(urls) {
    return UrlFmt.serviceParts(urls).map((part) =>
      UrlFmt.service(part, {
        highlightOrigin: part.highlightOrigin,
      })
    );
  },
};

/**
 * Helpers:
 */
function parts(url: t.Service.Url): t.CliFormat.Url.Parts {
  const parsed = Url.parse(url.href);
  if (!parsed.ok) {
    return {
      ok: false,
      href: url.href,
      origin: url.href,
      suffix: '',
      display: url.href,
    };
  }

  const value = parsed.toURL();
  const origin = displayOrigin(value);
  const suffix = formatSuffix(value);
  return {
    ok: true,
    href: url.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    ...(value.port ? { port: value.port } : {}),
  };
}

function toParts(url: t.Service.Url | t.CliFormat.Url.Parts): t.CliFormat.Url.Parts {
  return 'display' in url ? url : parts(url);
}

function formatParts(part: t.CliFormat.Url.Parts, highlightOrigin: boolean): string {
  const origin = highlightOrigin ? highlightOriginText(part) : c.gray(part.origin);
  const suffix = highlightOrigin && part.suffix === '/' ? c.cyan(part.suffix) : c.gray(part.suffix);
  return `${origin}${suffix}`;
}

function highlightOriginText(part: t.CliFormat.Url.Parts): string {
  if (!part.port) return c.cyan(part.origin);

  const prefix = part.origin.slice(0, -part.port.length);
  return `${c.cyan(prefix)}${c.bold(c.cyan(part.port))}`;
}

function formatSuffix(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}` || '/';
}

function displayOrigin(url: URL): string {
  return `${url.protocol}//${displayHost(url)}`;
}

function displayHost(url: URL): string {
  return url.port ? `${displayHostname(url)}:${url.port}` : displayHostname(url);
}

function displayHostname(url: URL): string {
  return url.hostname === '127.0.0.1' ? 'localhost' : url.hostname;
}
