import type { t } from './common.ts';

/**
 * Tools for declaring origin-url maps for slugs.
 */
export type SlugLoaderOriginLib = {
  readonly create: (port: t.PortNumber, prod: t.StringHostname) => t.SlugHttpOriginsSpecMap;
  readonly parse: (input: t.StringUrl | t.SlugLoaderOrigin) => t.SlugLoaderOrigin;
};

/**
 * Origin end-points:
 *
 *       staging.cdn
 *       └── slc
 *           ├── default   (manifests, json, images, etc.)
 *           └── video     (large streaming media)
 *
 *                    <hostname>
 *                cdn.<hostname>     ← staging.cdn/slc/default/*
 *          video.cdn.<hostname>     ← staging.cdn/slc/video/*
 *  <shard>.video.cdn.<hostname>     ← staging.cdn/slc/video/*
 *
 */
export type SlugLoaderOrigin = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};
