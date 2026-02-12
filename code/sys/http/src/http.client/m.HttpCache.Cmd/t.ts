import type { t } from './common.ts';
import type * as tCmd from '@sys/event/t';

/**
 * Namespace for HTTP cache command routing.
 *
 * This namespace is the default `Cmd.make({ ns })` value used by the
 * `Http.Cache.Cmd` factory and keeps cache-control commands isolated from
 * unrelated command sets sharing the same transport.
 */
export type HttpCacheCmdNamespace = 'http.cache';
export type HttpCacheCmdConnectKind = 'http.cache.cmd.connect';

/** Canonical command name for clearing HTTP cache entries. */
export type HttpCacheCmdName = 'http.cache.clear';

/** Scope selector for cache clear operations. */
export type HttpCacheCmdClearScope = 'pkg' | 'all';

/** Payload for the `http.cache.clear` command. */
export type HttpCacheCmdClearPayload = {
  readonly scope?: HttpCacheCmdClearScope;
};

/** Result payload for the `http.cache.clear` command. */
export type HttpCacheCmdClearResult = {
  readonly ok: boolean;
  readonly deleted: readonly t.StringKey[];
  readonly total: number;
  readonly at: t.Msecs;
};

/** Per-command request payload mapping. */
export type HttpCacheCmdPayloadMap = {
  readonly 'http.cache.clear': HttpCacheCmdClearPayload;
};

/**
 * Per-command result payload mapping.
 */
export type HttpCacheCmdResultMap = {
  readonly 'http.cache.clear': HttpCacheCmdClearResult;
};

/**
 * Per-command event payload mapping.
 *
 * Cache clear is unary only and does not emit stream events.
 */
export type HttpCacheCmdEventMap = {
  readonly 'http.cache.clear': never;
};

/**
 * Handler for the `http.cache.clear` command.
 */
export type HttpCacheCmdClearHandler = tCmd.CmdHandler<
  HttpCacheCmdName,
  HttpCacheCmdPayloadMap,
  HttpCacheCmdResultMap,
  'http.cache.clear'
>;

/**
 * Input for creating the default clear command handler.
 */
export type HttpCacheCmdClearHandlerArgs = {
  /**
   * Package descriptor used to derive pkg-scoped cache keys.
   */
  readonly pkg: t.Pkg;
};

/**
 * Built-in command handler factories for HTTP cache operations.
 */
export type HttpCacheCmdHandlersLib = {
  /**
   * Create the default clear handler backed by CacheStorage.
   *
   * Scope rules:
   * - `pkg` (default): deletes only this package's asset/media cache keys.
   * - `all`: deletes every CacheStorage key visible to this worker.
   */
  readonly clear: (args: HttpCacheCmdClearHandlerArgs) => HttpCacheCmdClearHandler;
};

/**
 * Minimal event target shape used for SW command connection handshakes.
 */
export type HttpCacheCmdListenTarget = {
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  start?: () => void;
};

/**
 * Options for `Http.Cache.Cmd.listen(...)`.
 */
export type HttpCacheCmdListenArgs = {
  /**
   * The event target that receives command connect handshakes.
   * Typically the service-worker global scope (`self`).
   */
  readonly target: HttpCacheCmdListenTarget;

  /**
   * Handler invoked when clients send `http.cache.clear`.
   */
  readonly clear: HttpCacheCmdClearHandler;

  /**
   * Optional default namespace for hosted command traffic.
   * A string `ns` from the handshake message overrides this per connection.
   */
  readonly ns?: tCmd.CmdNamespace;

  /**
   * Optional handshake kind override.
   * Defaults to `CacheCmd.CONNECT`.
   */
  readonly kind?: HttpCacheCmdConnectKind;

  /**
   * Suppress logger output from the command listener.
   * Defaults to `true`.
   */
  readonly silent?: boolean;
};

/**
 * HTTP cache command namespace.
 *
 * Provides stable command identifiers and a typed command factory
 * for wiring client/host command endpoints across any `Cmd` transport.
 */
export type HttpCacheCmdLib = {
  /** Default namespace used when no explicit `ns` is provided to `make`. */
  readonly NS: HttpCacheCmdNamespace;
  /** Handshake message kind for establishing command channels. */
  readonly CONNECT: HttpCacheCmdConnectKind;

  /** Canonical command name for cache clear operations. */
  readonly CLEAR: HttpCacheCmdName;
  /** Built-in handler factories for hosting cache commands. */
  readonly Handlers: HttpCacheCmdHandlersLib;

  /**
   * Create a typed command factory for the HTTP cache command set.
   *
   * This API is transport-agnostic and can be hosted over any endpoint that
   * satisfies the `Cmd` endpoint contract.
   */
  readonly make: (args?: {
    readonly ns?: tCmd.CmdNamespace;
  }) => tCmd.CmdFactory<
    HttpCacheCmdName,
    HttpCacheCmdPayloadMap,
    HttpCacheCmdResultMap,
    HttpCacheCmdEventMap
  >;

  /**
   * Listen for command-channel handshake messages and host clear handlers.
   *
   * Returns a lifecycle handle that detaches the listener and disposes all
   * active command hosts created by this listener.
   */
  readonly listen: (args: HttpCacheCmdListenArgs) => t.Lifecycle;
};
