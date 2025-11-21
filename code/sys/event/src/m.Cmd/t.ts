import type { t } from './common.ts';

export type * from './t.wire.ts';

/**
 * Namespace-style library surface for the command bus.
 * The implementation in `m.Cmd/mod.ts` should satisfy this shape.
 */
export type CmdLib<
  N extends string = t.CmdName,
  P extends CmdPayloadMap<N> = CmdPayloadMap<N>,
  R extends CmdResultPayloadMap<N> = CmdResultPayloadMap<N>,
> = {
  // makeClient(endpoint: CmdEndpoint): CmdClient<N, P, R>;
  // makeHost(endpoint: CmdEndpoint, handlers: CmdHandlers<N, P, R>): CmdHost;
};

/**
 * Host handle: returned from makeHost-style functions so callers
 * can detach listeners and dispose the command bus.
 */
export type CmdHost = t.Lifecycle;

/**
 * Minimal MessagePort-like endpoint used by the command bus.
 */
export type CmdEndpoint = {
  postMessage(data: unknown): void;
  addEventListener(type: 'message', fn: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', fn: (event: MessageEvent) => void): void;
  start?: () => void;
};

/**
 * Maps from command name → payload / result payload.
 * Concrete libs define their own name + maps (e.g. WorkerCmdName, etc).
 */
export type CmdPayloadMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };
export type CmdResultPayloadMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };

/**
 * Client surface: send a named command and await a typed result.
 */
export type CmdClient<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdResultPayloadMap<N>,
> = t.Lifecycle & {
  send<K extends N>(name: K, payload: P[K]): Promise<R[K]>;
};

/**
 * Host-side handler function for a single command name.
 */
export type CmdHandler<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdResultPayloadMap<N>,
  K extends N = N,
> = (payload: P[K]) => R[K] | Promise<R[K]>;

/**
 * Host-side handler map keyed by command name.
 */
export type CmdHandlers<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdResultPayloadMap<N>,
> = {
  readonly [K in N]: CmdHandler<N, P, R, K>;
};
