import { c, Cli, type t } from '../common.host.ts';
import { localOrigin } from '../u/u.origin.ts';
import { statusUrls } from '../u/u.status.url.ts';

/**
 * Format owner-local startup URLs for HTTP server terminal output.
 */
export function formatPrintUrls(input: {
  readonly addr: Deno.NetAddr;
  readonly paths: readonly t.HttpServer.Status.UrlPath[] | undefined;
  readonly settledOrigin?: t.StringUrl;
}): readonly t.Cli.Fmt.ServiceUrl.Part[] {
  const origin = input.settledOrigin ?? localOrigin(input.addr);
  return Cli.Fmt.ServiceUrl.parts(statusUrls(origin, input.paths), {
    ipv4Loopback: input.settledOrigin ? 'exact' : 'localhost',
  });
}

/** Fit a prepared URL while preserving origin, port, and suffix styling. */
export function urlValue(part: t.Cli.Fmt.ServiceUrl.Part, width?: number): string {
  if (width === undefined) return Cli.Fmt.ServiceUrl.format(part);
  if (Cli.Fmt.Text.Width.measure(part.display) <= width) return Cli.Fmt.ServiceUrl.format(part);

  return Cli.Fmt.Text.ellipsize(part.display, width, {
    render({ head, ellipsis, tail }) {
      const tailStart = part.display.length - tail.length;
      const headText = formatUrlFragment(part, head, 0);
      const omission = Cli.Fmt.omission(ellipsis);
      const tailText = formatUrlFragment(part, tail, tailStart);
      return `${headText}${omission}${tailText}`;
    },
  });
}

/**
 * Helpers:
 */
function formatUrlFragment(part: t.Cli.Fmt.ServiceUrl.Part, text: string, offset: number) {
  const originEnd = part.origin.length;
  const portStart = part.port ? originEnd - part.port.length : originEnd;
  const origin = part.highlightOrigin ? c.cyan : c.gray;
  const port = part.highlightOrigin ? (value: string) => c.bold(c.cyan(value)) : c.gray;
  const suffix = part.highlightOrigin && part.suffix === '/' ? c.cyan : c.gray;
  return [
    formatUrlRange(text, offset, 0, portStart, origin),
    formatUrlRange(text, offset, portStart, originEnd, port),
    formatUrlRange(text, offset, originEnd, part.display.length, suffix),
  ].join('');
}

function formatUrlRange(
  text: string,
  offset: number,
  start: number,
  end: number,
  color: (value: string) => string,
) {
  const from = Math.max(offset, start);
  const to = Math.min(offset + text.length, end);
  return from >= to ? '' : color(text.slice(from - offset, to - offset));
}
