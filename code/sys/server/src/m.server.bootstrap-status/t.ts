import type { t } from './common.ts';

/**
 * Inert loopback bootstrap-status host contracts.
 */
export declare namespace BootstrapStatus {
  /** Public bootstrap-status host surface. */
  export type Lib = {
    /** Start one launch-scoped observational status host. */
    start<K extends string>(options: StartOptions<K>): Promise<Started>;
  };

  /** Options for one launch-scoped status host. */
  export type StartOptions<K extends string = string> = {
    /** Finite caller-owned page variants copied before listener startup. */
    pages: readonly Page<K>[];

    /** Synchronously select one page or one admitted application redirect. */
    resolve: Resolver<K>;
  };

  /** One named HTML byte variant copied during startup. */
  export type Page<K extends string = string> = {
    /** Caller-owned projection key; it is never exposed over HTTP. */
    key: K;

    /** Complete HTML response bytes copied before listener startup. */
    bytes: Uint8Array;
  };

  /** Synchronously project the caller's current trusted state. */
  export type Resolver<K extends string = string> = () => Projection<K>;

  /** One observational response selected from a synchronous state snapshot. */
  export type Projection<K extends string = string> = PageProjection<K> | RedirectProjection;

  /** Select one page copied during startup. */
  export type PageProjection<K extends string = string> = {
    readonly kind: 'page';
    readonly key: K;
  };

  /** Redirect to one exact pre-admitted numeric-loopback application origin. */
  export type RedirectProjection = {
    readonly kind: 'redirect';
    readonly origin: t.StringUrl;
  };

  /** Narrow lifecycle facade for one running status host. */
  export type Started = {
    /** Exact capability URL; possession grants observation only. */
    readonly url: t.StringUrl;

    /** Settles when the internal listener finishes; lower failures are sanitized. */
    readonly finished: Promise<void>;

    /** Whether listener disposal has settled. */
    readonly disposed: boolean;

    /** Idempotently close the internal listener through one sanitized completion. */
    close(reason?: unknown): Promise<void>;
  };
}
