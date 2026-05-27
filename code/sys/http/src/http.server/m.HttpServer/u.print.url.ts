import { c, Is, Str, type t } from './common.ts';
import { localHost, localOrigin } from './u.origin.ts';

/**
 * Format owner-local startup URLs for HTTP server terminal output.
 */
export function formatPrintUrls(input: {
  readonly addr: Deno.NetAddr;
  readonly paths: readonly t.HttpServerStatusUrlPath[] | undefined;
}): readonly string[] {
  const paths = input.paths && input.paths.length > 0 ? input.paths : ['/'] as const;
  return paths.map((path, index) => {
    const origin = index === 0 ? formatOrigin(input.addr) : formatSubtle(localOrigin(input.addr));
    return formatDisplayHref(origin, pathOf(path));
  });
}

function formatOrigin(addr: Deno.NetAddr) {
  return c.cyan(`http://${localHost(addr.hostname)}:${formatPort(addr.port)}`);
}

function formatPort(port: number) {
  return c.bold(c.brightCyan(String(port)));
}

function pathOf(input: t.HttpServerStatusUrlPath): string {
  return Is.str(input) ? input : input.path;
}

function formatDisplayHref(origin: string, path: string) {
  return `${origin}${formatSubtle(`/${Str.trimLeadingSlashes(path)}`)}`;
}

function formatSubtle(text: string) {
  return c.dim(c.gray(text));
}
