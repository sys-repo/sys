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
 * HTTP cache command namespace.
 *
 * Provides stable command identifiers and a typed command factory
 * for wiring client/host command endpoints across any `Cmd` transport.
 */
export type HttpCacheCmdLib = {
  /** Default namespace used when no explicit `ns` is provided to `make`. */
  readonly NS: HttpCacheCmdNamespace;

  /** Canonical command name for cache clear operations. */
  readonly CLEAR: HttpCacheCmdName;

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
};
