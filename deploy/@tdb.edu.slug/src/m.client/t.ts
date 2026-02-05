import type { t } from './common.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugLoaderLib = {
  readonly make: (origin: t.StringUrl | t.SlugLoaderOrigin) => t.SlugLoader;
  readonly Fetch: t.SlugClientLib;
  readonly Origin: {
    readonly create: (port: t.PortNumber, prod: t.StringHostname) => t.SlugHttpOriginsSpecMap;
    readonly parse: (input: t.StringUrl | t.SlugLoaderOrigin) => t.SlugLoaderOrigin;
  };
};

/**
 * Client loader instance.
 */
export type SlugLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugLoaderOrigin;
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
