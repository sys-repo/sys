import { Cli, type t } from './common.ts';
import { localOrigin } from './u.origin.ts';
import { statusUrls } from './u.status.url.ts';

/**
 * Format owner-local startup URLs for HTTP server terminal output.
 */
export function formatPrintUrls(input: {
  readonly addr: Deno.NetAddr;
  readonly paths: readonly t.HttpServerStatusUrlPath[] | undefined;
}): readonly string[] {
  const origin = localOrigin(input.addr);
  return Cli.Fmt.Url.serviceList(statusUrls(origin, input.paths));
}
