import type { t } from './common.ts';

type UrlInput = t.UrlLike | t.StringUrl;

/**
 * Immutable URL helpers layered on top of the standard UrlLib.
 */
export type ImmutableUrlLib = t.StdUrlLib & {
  /**
   * Construct an ImmutableRef<URL> from a URL-like input.
   *
   * The returned handle provides:
   * - pure URL snapshots via `current`
   * - safe mutation via `change`
   * - RFC-6902 diff events via `events()`
   */
  ref(init: UrlInput): UrlRef;

  /**
   * Create a tiny DSL wrapper around a UrlRef.
   *
   * - `read` maps the underlying URL snapshot to a config shape.
   * - `write` reapplies the config to the UrlRef.
   */
  dsl<C>(
    init: UrlInput,
    read: (url: URL) => C,
    write: (ref: UrlRef, config: C) => void,
  ): UrlDslRef<C>;
};

/**
 * ImmutableRef handle for a URL value.
 *
 * - `current` is a URL snapshot.
 * - `change` applies mutations via RFC-6902 patch semantics.
 * - `events()` exposes patch-based change streams.
 */
export type UrlRef = t.ImmutableRef<URL, UrlPatch>;
/** RFC-6902 patch operation for URL mutations. */
export type UrlPatch = t.Rfc6902PatchOperation;

/**
 * Immutable DSL handle derived from a UrlRef.
 *
 * - `current` is the underlying URL snapshot.
 * - `change` mutates a config draft derived from the URL, then reapplies it.
 */
export type UrlDslRef<C> = {
  readonly current: URL;
  readonly change: (fn: (draft: C) => void) => void;
};
