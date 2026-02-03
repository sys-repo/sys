import type { t } from './common.ts';

type MakeArgs = { origin: t.StringUrl | SlugClientOrigin };

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugClientLoaderLib = {
  readonly Fetch: t.SlugClientLib;
  readonly make: (args: MakeArgs) => t.SlugClientLoader;
};

/**
 * Client loader instance.
 */
export type SlugClientLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugClientOrigin;
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
export type SlugClientOrigin = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};
