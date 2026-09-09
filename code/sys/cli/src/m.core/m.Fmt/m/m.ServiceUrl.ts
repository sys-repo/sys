import { c, type t } from '../common.ts';
import { displayHostname, parts, prepare } from '../u/u.serviceUrl.prepare.ts';

/** CLI formatting helpers for service URLs. */
export const ServiceUrl: t.CliFormat.ServiceUrl.Lib = Object.freeze({
  displayHostname,

  parts(urls, options = {}) {
    return parts(urls, options);
  },

  format(
    input: t.Service.Url | t.CliFormat.ServiceUrl.Part,
    options: t.CliFormat.ServiceUrl.Format.Options = {},
  ) {
    const prepared = 'highlightOrigin' in input
      ? input
      : prepare(input, options, options.origin === 'highlight');
    return formatPart(prepared);
  },

  formatList(urls, options = {}) {
    return parts(urls, options).map(formatPart);
  },
});

function formatPart(part: t.CliFormat.ServiceUrl.Part): string {
  const origin = part.highlightOrigin ? highlightOriginText(part) : c.gray(part.origin);
  const suffix = part.highlightOrigin && part.suffix === '/'
    ? c.cyan(part.suffix)
    : c.gray(part.suffix);
  return `${origin}${suffix}`;
}

function highlightOriginText(part: t.CliFormat.ServiceUrl.Part): string {
  if (!part.port) return c.cyan(part.origin);

  const prefix = part.origin.slice(0, -part.port.length);
  return `${c.cyan(prefix)}${c.bold(c.cyan(part.port))}`;
}
