import type { t } from './common.ts';
import type * as TCmd from '@sys/event/t';

/**
 * HTTP cache command contracts.
 */
export declare namespace HttpCacheCmd {
  /**
   * HTTP cache command namespace.
   *
   * Provides stable command identifiers and a typed command factory
   * for wiring client/host command endpoints across any `Cmd` transport.
   */
  export type Lib = {
    /** Default namespace used when no explicit `ns` is provided to `make`. */
    readonly NS: Namespace;
    /** Handshake message kind for establishing command channels. */
    readonly CONNECT: Connect.Kind;

    /** Canonical command name for cache clear operations. */
    readonly CLEAR: Clear.Name;
    /** Canonical command name for cache info operations. */
    readonly INFO: Info.Name;
    /** Built-in handler factories for hosting cache commands. */
    readonly Handlers: Handlers.Lib;

    /**
     * Create a typed command factory for the HTTP cache command set.
     *
     * This API is transport-agnostic and can be hosted over any endpoint that
     * satisfies the `Cmd` endpoint contract.
     */
    readonly make: (args?: {
      readonly ns?: TCmd.Cmd.Namespace;
    }) => TCmd.Cmd.Factory<Name, PayloadMap, ResultMap, EventMap>;

    /**
     * Listen for command-channel handshake messages and host clear handlers.
     *
     * Returns a lifecycle handle that detaches the listener and disposes all
     * active command hosts created by this listener.
     */
    readonly listen: (args: Listen.Args) => t.Lifecycle;
  };

  /** Namespace for HTTP cache command routing. */
  export type Namespace = 'http.cache';

  /** Canonical command names for HTTP cache commands. */
  export type Name = Clear.Name | Info.Name;

  /** Per-command request payload mapping. */
  export type PayloadMap = {
    readonly 'http.cache.clear': Clear.Payload;
    readonly 'http.cache.info': Info.Payload;
  };

  /** Per-command result payload mapping. */
  export type ResultMap = {
    readonly 'http.cache.clear': Clear.Result;
    readonly 'http.cache.info': Info.Result;
  };

  /**
   * Per-command event payload mapping.
   *
   * Cache clear is unary only and does not emit stream events.
   */
  export type EventMap = {
    readonly 'http.cache.clear': never;
    readonly 'http.cache.info': never;
  };

  /**
   * HTTP cache command connection contracts.
   */
  export namespace Connect {
    /** Handshake message kind for establishing command channels. */
    export type Kind = 'http.cache.cmd.connect';
  }

  /**
   * HTTP cache clear command contracts.
   */
  export namespace Clear {
    /** Canonical command name for cache clear operations. */
    export type Name = 'http.cache.clear';

    /** Scope selector for cache clear operations. */
    export type Scope = 'pkg' | 'all';

    /** Payload for the `http.cache.clear` command. */
    export type Payload = {
      readonly scope?: Scope;
    };

    /** Result payload for the `http.cache.clear` command. */
    export type Result = {
      readonly ok: boolean;
      readonly deleted: readonly t.StringKey[];
      readonly total: number;
      readonly at: t.Msecs;
    };

    /** Handler for the `http.cache.clear` command. */
    export type Handler = (
      payload: Payload,
      ctx?: HttpCacheCmd.Handler.Context<'http.cache.clear'>,
    ) => Result | Promise<Result>;
  }

  /**
   * HTTP cache info command contracts.
   */
  export namespace Info {
    /** Canonical command name for cache info operations. */
    export type Name = 'http.cache.info';

    /** Payload for the `http.cache.info` command. */
    export type Payload = {
      readonly scope?: Clear.Scope;
    };

    /** Cache classification in info output. */
    export type Kind = 'asset' | 'media' | 'media-range' | 'other';

    /** Per-cache info entry. */
    export type Cache = {
      readonly name: t.StringKey;
      readonly kind: Kind;
      readonly entries: number;
      /** Optional estimated bytes for the cache (when available). */
      readonly bytes?: number;
      /** Optional metadata-entry count (eg. range index rows). */
      readonly metaEntries?: number;
    };

    /** Result payload for the `http.cache.info` command. */
    export type Result = {
      readonly ok: boolean;
      readonly at: t.Msecs;
      readonly scope: Clear.Scope;
      readonly totals: {
        readonly caches: number;
        readonly entries: number;
        /** Optional estimated bytes across returned caches. */
        readonly bytes?: number;
      };
      readonly caches: readonly Cache[];
      /** Optional diagnostics for media range caching. */
      readonly diagnostics?: {
        readonly mediaRange?: {
          readonly caches: number;
          readonly entries: number;
          readonly bytes: number;
          readonly metaEntries: number;
        };
      };
    };

    /** Handler for the `http.cache.info` command. */
    export type Handler = (
      payload: Payload,
      ctx?: HttpCacheCmd.Handler.Context<'http.cache.info'>,
    ) => Result | Promise<Result>;
  }

  /**
   * HTTP cache command handler contracts.
   */
  export namespace Handler {
    /** Per-command handler context. */
    export type Context<K extends Name = Name> = TCmd.Cmd.Handler.Context<Name, EventMap, K>;

    /** Input for creating default command handlers. */
    export type Args = {
      /** Package descriptor used to derive pkg-scoped cache keys. */
      readonly pkg: t.Pkg;
    };
  }

  /**
   * Built-in command handler contracts.
   */
  export namespace Handlers {
    /** Built-in command handler factories for HTTP cache operations. */
    export type Lib = {
      /**
       * Create the default clear handler backed by CacheStorage.
       *
       * Scope rules:
       * - `pkg` (default): deletes this package's asset/media/media-range cache keys.
       * - `all`: deletes every CacheStorage key visible to this worker.
       */
      readonly clear: (args: Handler.Args) => Clear.Handler;

      /**
       * Create the default info handler backed by CacheStorage.
       *
       * Scope rules:
       * - `pkg` (default): reports this package's asset/media/media-range cache keys.
       * - `all`: reports every CacheStorage key visible to this worker.
       */
      readonly info: (args: Handler.Args) => Info.Handler;

      /** Create the full default handler set for SW command hosting. */
      readonly all: (args: Handler.Args) => {
        readonly clear: Clear.Handler;
        readonly info: Info.Handler;
      };
    };
  }

  /**
   * HTTP cache command listener contracts.
   */
  export namespace Listen {
    /** Minimal event target shape used for SW command connection handshakes. */
    export type Target = {
      addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
      removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
      start?: () => void;
    };

    /** Options for `Http.Cache.Cmd.listen(...)`. */
    export type Args = {
      /**
       * The event target that receives command connect handshakes.
       * Typically the service-worker global scope (`self`).
       */
      readonly target: Target;

      /** Handler invoked when clients send `http.cache.clear`. */
      readonly clear: Clear.Handler;

      /**
       * Optional handler for `http.cache.info`.
       * If omitted, info requests fail with a command error.
       */
      readonly info?: Info.Handler;

      /**
       * Optional default namespace for hosted command traffic.
       * A string `ns` from the handshake message overrides this per connection.
       */
      readonly ns?: TCmd.Cmd.Namespace;

      /**
       * Optional handshake kind override.
       * Defaults to `CacheCmd.CONNECT`.
       */
      readonly kind?: Connect.Kind;

      /**
       * Suppress logger output from the command listener.
       * Defaults to `true`.
       */
      readonly silent?: boolean;

      /** Optional lifecycle boundary for auto-disposing the listener. */
      readonly until?: t.UntilInput;
    };
  }
}
