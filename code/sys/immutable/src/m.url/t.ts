import type { t } from './common.ts';

/**
 * Immutable URL helpers layered on top of the standard URL helpers.
 */
export declare namespace ImmutableUrl {
  /** Immutable URL helper module surface. */
  export type Lib = t.Url.Lib & {
    /**
     * Construct an ImmutableRef<URL> from a URL-like input.
     *
     * The returned handle provides:
     * - pure URL snapshots via `current`
     * - safe mutation via `change`
     * - RFC-6902 diff events via `events()`
     */
    ref(init: Input): Ref;

    /**
     * Create a tiny DSL wrapper around an immutable URL ref.
     *
     * - `read` maps the underlying URL snapshot to a config shape.
     * - `write` reapplies the config to the immutable URL ref.
     */
    dsl<C>(
      init: Input,
      read: (url: URL) => C,
      write: (ref: Ref, config: C) => void,
    ): Dsl.Ref<C>;
  };

  /** Inputs accepted by URL ref factories. */
  export type Input = t.UrlLike | t.StringUrl;

  /**
   * ImmutableRef handle for a URL value.
   *
   * - `current` is a URL snapshot.
   * - `change` applies mutations via RFC-6902 patch semantics.
   * - `events()` exposes patch-based change streams.
   */
  export type Ref = t.ImmutableRef<URL, Patch>;

  /** Readonly ImmutableRef handle for a URL value. */
  export type RefReadonly = t.ImmutableRefReadonly<URL, Patch>;

  /** RFC-6902 patch operation for URL mutations. */
  export type Patch = t.Rfc6902PatchOperation;

  /** Immutable URL DSL contracts. */
  export namespace Dsl {
    /**
     * Immutable DSL handle derived from an immutable URL ref.
     *
     * - `url` exposes a read-only view of the underlying immutable URL ref
     *   (no `.change`, but instance + events are available).
     * - `current` is the projected config shape C.
     * - `change` mutates a config draft, then reapplies it to the URL.
     */
    export type Ref<C> = {
      readonly url: ImmutableUrl.RefReadonly;
      readonly current: C;
      readonly change: (fn: (draft: C) => void) => void;
    };
  }
}
