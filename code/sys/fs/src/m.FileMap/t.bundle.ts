import { type t } from './common.ts';

/** Bundles a directory into a `FileMap` data-uri object */
export type FileMapBundler = (
  dir: t.StringDir,
  options?: t.FileMapBundleOptions | t.FileMapBundleFilter,
) => Promise<t.FileMap>;

/** Options passed to the `FileMap.bundle` method. */
export type FileMapBundleOptions = {
  filter?: FileMapBundleFilter;
};

/** Filter the narrow down files included within a `FileMap` bundle. */
export type FileMapBundleFilter = (e: FileMapBundleFilterArgs) => boolean;
export type FileMapBundleFilterArgs = {
  path: t.StringPath;
  contentType: string;
  ext: string;
};
