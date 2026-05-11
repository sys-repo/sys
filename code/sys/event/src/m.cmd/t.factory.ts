import type { t } from './common.ts';

/**
 * Factory for a typed command set:
 * - N: command names
 * - P: payloads per name
 * - R: result payloads per name
 * - E: streamed event payloads per name
 *
 * Produces transport-bound endpoints.
 */
export type CmdFactory<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
  E extends t.CmdPayloadEventMap<N> = t.CmdPayloadEventMap<N>,
> = {
  host(
    endpoint: t.CmdEndpoint,
    handlers: t.CmdHandlers<N, P, R, E>,
    opts?: t.CmdHostOptions,
  ): t.CmdHost;
  client(endpoint: t.CmdEndpoint, opts?: t.CmdClientOptions): t.CmdClient<N, P, R, E>;
};

/** Options passed to `Cmd.make().client()` */
export type CmdClientOptions = {
  /** Optional timeout in milliseconds for each command request. */
  timeout?: t.Msecs;
  /** Close the underlying endpoint when the client is disposed. Defaults to false. */
  closeEndpoint?: boolean;
};

/** Options passed to `Cmd.make().host()` */
export type CmdHostOptions = {
  /** Close the underlying endpoint when the host is disposed. Defaults to false. */
  closeEndpoint?: boolean;
};

/**
 * Factory for creating typed command factories.
 */
export type CmdMakeFactory = <
  N extends string = t.CmdName,
  P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
  E extends t.CmdPayloadEventMap<N> = t.CmdPayloadEventMap<N>,
>(
  opts?: t.CmdMakeOptions,
) => t.CmdFactory<N, P, R, E>;
