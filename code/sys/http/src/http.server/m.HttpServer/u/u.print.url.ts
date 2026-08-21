import { Cli, type t } from '../common.ts';
import { localOrigin } from './u.origin.ts';
import { statusUrls } from './u.status.url.ts';

/**
 * Format owner-local startup URLs for HTTP server terminal output.
 */
export function formatPrintUrls(input: {
  readonly addr: Deno.NetAddr;
  readonly paths: readonly t.HttpServer.Status.UrlPath[] | undefined;
  readonly settledOrigin?: t.StringUrl;
}) {
  const origin = input.settledOrigin ?? localOrigin(input.addr);
  return Cli.Fmt.ServiceUrl.parts(statusUrls(origin, input.paths), {
    ipv4Loopback: input.settledOrigin ? 'exact' : 'localhost',
  });
}
