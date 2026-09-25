import type { t } from './common.ts';

/**
 * Web Standards runtime fixtures and their exact own-property transaction substrate.
 */
export declare namespace WebFixture {
  /** Runtime library surface for Web Standards fixtures and their transaction substrate. */
  export type Lib = {
    /** Fetch global test fixtures. */
    readonly Fetch: Fetch.Lib;
    /** Property-descriptor test fixtures. */
    readonly Property: Property.Lib;
    /** WebSocket global test fixtures. */
    readonly WebSocket: WebSocket.Lib;
  };

  /**
   * Low-level own-property transaction substrate for runtime fixtures.
   *
   * This owner is public so callers can build exact fixtures for additional Web-runtime globals
   * without duplicating descriptor restoration mechanics.
   */
  export namespace Property {
    /** Runtime library surface for property-descriptor fixtures. */
    export type Lib = {
      /** Identify a cleanup failure produced by this Property owner. */
      readonly isCleanupError: IsCleanupError;
      /** Install one exact own-property transaction until the returned handle is disposed. */
      readonly mock: MockFactory;
    };

    /**
     * Factory for an exact, lifecycle-scoped own-property transaction.
     *
     * Ordinary-object transitions are preflighted and verified. Proxies and host objects must
     * report stable, truthful property descriptors. Setup rolls back in reverse order. Do not
     * mutate owned properties while active; dispose nested transactions in LIFO order and do not
     * overlap shared targets across tests. Distinct proxies remain distinct authorities even when
     * they forward to one backing object.
     */
    export type MockFactory = (entries: readonly Entry[]) => Mock;

    /** Identify a Property cleanup error without confusing caller-supplied `AggregateError`s. */
    export type IsCleanupError = (value: unknown) => value is CleanupError;

    /** One own-property replacement within a descriptor transaction. */
    export type Entry = {
      /** Object that owns the property transaction. */
      target: object;
      /** Property key whose numeric form is normalized to its ECMAScript string key. */
      key: PropertyKey;
      /** Partial descriptor applied with standard `Object.defineProperty` semantics. */
      descriptor: PropertyDescriptor;
    };

    /**
     * Active descriptor transaction.
     *
     * Successful disposal restores every prior descriptor exactly and is idempotent. Incomplete
     * disposal throws `RestoreError`; its `rollback` handle retries only unrestored entries.
     */
    export type Mock = t.Disposable;

    /** Stage that left Property cleanup incomplete. */
    export type CleanupErrorKind = 'setup' | 'restore';

    /** Incomplete cleanup with immutable causes and retained retry authority. */
    export type CleanupError = Omit<AggregateError, 'errors'> & {
      readonly errors: readonly unknown[];
      readonly kind: CleanupErrorKind;
      readonly rollback: Mock;
    };

    /**
     * Setup failure whose immediate rollback was incomplete.
     * `errors` contains the setup failure followed by rollback failures in LIFO order.
     */
    export type SetupError = CleanupError & { readonly kind: 'setup' };

    /** Disposal failure whose exact restoration remains retryable. */
    export type RestoreError = CleanupError & { readonly kind: 'restore' };
  }

  /**
   * Fetch global test fixtures.
   */
  export namespace Fetch {
    /** Runtime library surface for Fetch test fixtures. */
    export type Lib = {
      /** Replace `globalThis.fetch` until the returned handle is disposed. */
      readonly mock: MockFactory;
    };

    /** Factory for lifecycle-scoped replacement of `globalThis.fetch`. */
    export type MockFactory = (replacement: t.Fetch) => Mock;

    /** Active Fetch mock handle with exact, idempotent, retryable restoration. */
    export type Mock = t.Disposable;
  }

  /**
   * WebSocket global test fixtures.
   */
  export namespace WebSocket {
    /** Runtime library surface for WebSocket test fixtures. */
    export type Lib = {
      /** Mock `globalThis.WebSocket` until the returned handle is disposed. */
      readonly mock: MockFactory;
    };

    /**
     * Factory for lifecycle-scoped replacement of `globalThis.WebSocket`.
     *
     * The replacement provides URL and ready-state observation, state constants, microtask-driven
     * open and close events, and a no-op `send`. It does not model messages, protocols, or
     * `CloseEvent` metadata. Successful disposal restores the exact prior descriptor. Incomplete
     * disposal throws `Property.RestoreError` with retry authority.
     */
    export type MockFactory = () => Mock;

    /** Active WebSocket mock handle with exact, idempotent, retryable restoration. */
    export type Mock = t.Disposable;
  }
}
