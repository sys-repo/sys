import type { t } from './common.ts';

type MakeArgs = { origin: t.StringUrl | SlugLoaderOrigin };

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugLoaderLib = {
  readonly Fetch: t.SlugClientLib;
  readonly make: (args: MakeArgs) => t.SlugLoader;
};

/**
 * Client loader instance.
 */
export type SlugLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugLoaderOrigin;
  /** SlugTree loader bound to the loader origin. */
  readonly Tree: SlugLoaderTreeLib;
};

/**
 * Origin end-points:
 *
 *       staging.cdn
 *       └── slc
 *           ├── default   (manifests, json, images, etc.)
 *           └── video     (large streaming media)
 *
 *             <hostname>
 *         cdn.<hostname>     ← staging.cdn/slc/default/*
 *   video.cdn.<hostname>     ← staging.cdn/slc/video/*
 *
 */
export type SlugLoaderOrigin = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

export type SlugLoaderTreeLib = {
  readonly load: (
    docid: t.StringId,
    options?: t.SlugTreeLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};
