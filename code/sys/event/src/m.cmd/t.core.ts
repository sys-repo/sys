import type { t } from './common.ts';

/**
 * Host handle: lifecycle for a command host attached to an endpoint.
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
  close?: () => void;
};

/**
 * Maps from command name → payload / result payload.
 * Concrete libs define their own name + maps (e.g. WorkerCmdName, etc).
 */
export type CmdPayloadMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };
export type CmdPayloadResultMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };

/**
 * Client surface: send a named command and await a typed result.
 */
export type CmdClient<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdPayloadResultMap<N>,
> = t.Lifecycle & {
  send<K extends N>(name: K, payload: P[K]): Promise<R[K]>;
};

/**
 * Host-side handler function for a single command name.
 */
export type CmdHandler<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdPayloadResultMap<N>,
  K extends N = N,
> = (payload: P[K]) => R[K] | Promise<R[K]>;

/**
 * Host-side handler map keyed by command name.
 */
export type CmdHandlers<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdPayloadResultMap<N>,
> = {
  readonly [K in N]: CmdHandler<N, P, R, K>;
};
