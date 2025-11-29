import type { t } from './common.ts';

/** RFC-6902 patch operation for URL mutations. */
export type UrlPatch = t.Rfc6902PatchOperation;

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
  ref(init: t.UrlLike): UrlRef;
};

/**
 * ImmutableRef handle for a URL value.
 *
 * - `current` is a URL snapshot.
 * - `change` applies mutations via RFC-6902 patch semantics.
 * - `events()` exposes patch-based change streams.
 */
export type UrlRef = t.ImmutableRef<URL, UrlPatch>;
