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
    /** Payload for the cache clear command. */
    readonly 'http.cache.clear': Clear.Payload;
    /** Payload for the cache info command. */
    readonly 'http.cache.info': Info.Payload;
  };

  /** Per-command result payload mapping. */
  export type ResultMap = {
    /** Result for the cache clear command. */
    readonly 'http.cache.clear': Clear.Result;
    /** Result for the cache info command. */
    readonly 'http.cache.info': Info.Result;
  };

  /**
   * Per-command event payload mapping.
   *
   * Cache clear is unary only and does not emit stream events.
   */
  export type EventMap = {
    /** Clear is unary and does not stream events. */
    readonly 'http.cache.clear': never;
    /** Info is unary and does not stream events. */
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
      /** Cache scope to clear; defaults to this package only. */
      readonly scope?: Scope;
    };

    /** Result payload for the `http.cache.clear` command. */
    export type Result = {
      /** True when the clear handler completed. */
      readonly ok: boolean;
      /** CacheStorage keys deleted by the handler. */
      readonly deleted: readonly t.StringKey[];
      /** Number of deleted cache keys. */
      readonly total: number;
      /** Completion timestamp. */
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
      /** Cache scope to inspect; defaults to this package only. */
      readonly scope?: Clear.Scope;
    };

    /** Cache classification in info output. */
    export type Kind = 'asset' | 'media' | 'media-range' | 'other';

    /** Per-cache info entry. */
    export type Cache = {
      /** CacheStorage key. */
      readonly name: t.StringKey;
      /** Cache classification derived from the key. */
      readonly kind: Kind;
      /** Number of data entries in the cache. */
      readonly entries: number;
      /** Optional estimated bytes for the cache (when available). */
      readonly bytes?: number;
      /** Optional metadata-entry count (eg. range index rows). */
      readonly metaEntries?: number;
    };

    /** Result payload for the `http.cache.info` command. */
    export type Result = {
      /** True when the info handler completed. */
      readonly ok: boolean;
      /** Completion timestamp. */
      readonly at: t.Msecs;
      /** Cache scope used for this result. */
      readonly scope: Clear.Scope;
      readonly totals: {
        /** Number of caches reported. */
        readonly caches: number;
        /** Total data entries across reported caches. */
        readonly entries: number;
        /** Optional estimated bytes across returned caches. */
        readonly bytes?: number;
      };
      /** Per-cache summaries. */
      readonly caches: readonly Cache[];
      /** Optional diagnostics for media range caching. */
      readonly diagnostics?: {
        /** Aggregate diagnostics for range-window media cache entries. */
        readonly mediaRange?: {
          /** Number of media-range caches reported. */
          readonly caches: number;
          /** Data entries tracked in media-range caches. */
          readonly entries: number;
          /** Estimated bytes tracked in media-range caches. */
          readonly bytes: number;
          /** Metadata rows tracked for media-range entries. */
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
      /** Register a service-worker message listener. */
      addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
      /** Remove a service-worker message listener. */
      removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
      /** Optional start hook for MessagePort-like targets. */
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
