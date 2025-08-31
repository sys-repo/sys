import { type t } from './common.ts';

type OptInput = t.FileMapToMapOptions | t.FileMapBundleFilter;

/** Bundles a directory into a `FileMap` result object. */
export type FileMapToMap = (dir: t.StringDir, options?: OptInput) => Promise<t.FileMap>;
/** Options passed to the `FileMap.toMap` method. */
export type FileMapToMapOptions = { filter?: FileMapBundleFilter };

/**
 * Filter to narrow down files included within a `FileMap` bundle.
 */
export type FileMapBundleFilter = (e: t.FileMapBundleFilterArgs) => boolean;
export type FileMapBundleFilterArgs = {
  readonly path: t.StringPath;
  readonly contentType: string;
  readonly ext: string;
};
