import { c, type t, Url } from '../common.ts';

/** CLI formatting helpers for service URLs. */
export const UrlFmt: t.CliFormat.Lib['Url'] = {
  service(url, options = {}) {
    return format(url, options.highlightOrigin === true);
  },

  serviceList(urls) {
    return urls.map((url, index) => UrlFmt.service(url, { highlightOrigin: index === 0 }));
  },
};

/**
 * Helpers:
 */
function format(url: t.Service.Url, highlightOrigin: boolean): string {
  const parsed = Url.parse(url.href);
  if (!parsed.ok) return (highlightOrigin ? c.cyan : c.gray)(url.href);

  const value = parsed.toURL();
  const origin = highlightOrigin ? highlightOriginText(value) : c.gray(displayOrigin(value));
  return `${origin}${c.gray(formatSuffix(value))}`;
}

function highlightOriginText(url: URL): string {
  if (!url.port) return c.cyan(displayOrigin(url));
  return `${c.cyan(`${url.protocol}//${displayHostname(url)}:`)}${c.bold(c.cyan(url.port))}`;
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
