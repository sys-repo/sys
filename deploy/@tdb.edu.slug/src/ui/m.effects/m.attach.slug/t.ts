import type { t } from '../common.ts';

export type SlugPlaybackSlugState = {
  /** TreeHost view of available slugs. */
  readonly tree?: t.TreeHostViewNodeList;

  /** Currently selected TreeHost path. */
  readonly selectedPath?: t.ObjectPath;

  /** Slug loading state. */
  readonly loading?: SlugPlaybackLoading;

  /** Terminal load error, if any. */
  readonly error?: { readonly message: string };
};

export type SlugPlaybackLoading = {
  /** Indicates an in-flight slug load. */
  readonly isLoading?: boolean;
  /** Ref currently being fetched (staleness guard). */
  readonly loadingRef?: string;
  /** Ref last attempted (success or failure). */
  readonly loadedRef?: string;
};

