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
/**
 * Maps from command name → result payload.
 */
export type CmdPayloadResultMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };
/**
 * Maps from command name → event payload for streaming commands.
 * Concrete command sets can specialise this, or fall back to `unknown`.
 */
export type CmdPayloadEventMap<N extends string = t.CmdName> = { readonly [K in N]: unknown };

/**
 * Client surface: send a named command and await a typed result.
 * Base (unary-only) shape.
 */
export type CmdClientUnary<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdPayloadResultMap<N>,
> = t.Lifecycle & {
  send<K extends N>(name: K, payload: P[K]): Promise<R[K]>;
};

/**
 * Handle returned from a streaming command invocation.
 *
 * - `id`: the underlying request identifier.
 * - `done`: resolves with the terminal result payload.
 * - `dispose`: cancels the stream (if still active).
 * - `onEvent`: subscribe to mid-stream events for this command.
 */
export type CmdStream<
  N extends string,
  R extends CmdPayloadResultMap<N>,
  E extends CmdPayloadEventMap<N> = CmdPayloadEventMap<N>,
  K extends N = N,
> = {
  readonly id: t.CmdReqId;
  readonly done: Promise<R[K]>;
  dispose(): void;
  onEvent(fn: (event: E[K]) => void): t.Lifecycle;
};

/**
 * Full client: unary + streaming.
 *
 * Most callers should depend on this type.
 * More constrained surfaces can type against `CmdClientUnary` if they
 * only care about `send`.
 */
export type CmdClient<
  N extends string,
  P extends CmdPayloadMap<N>,
  R extends CmdPayloadResultMap<N>,
  E extends CmdPayloadEventMap<N> = CmdPayloadEventMap<N>,
> = CmdClientUnary<N, P, R> & {
  stream<K extends N>(name: K, payload: P[K]): CmdStream<N, R, E, K>;
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
