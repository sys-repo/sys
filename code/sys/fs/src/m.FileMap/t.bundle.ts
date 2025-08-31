import { type t } from './common.ts';

/** Bundles a directory into a `FileMap` result object. */
export type FileMapToMap = (
  dir: t.StringDir,
  options?: t.FileMapToMapOptions | t.FileMapBundleFilter,
) => Promise<t.FileMap>;

/** Options passed to the `FileMap.toMap` method. */
export type FileMapToMapOptions = { filter?: FileMapBundleFilter };

/** Filter to narrow down files included within a `FileMap` bundle. */
export type FileMapBundleFilter = (e: t.FileMapBundleFilterArgs) => boolean;
export type FileMapBundleFilterArgs = {
  readonly path: t.StringPath;
  readonly contentType: string;
  readonly ext: string;
};

/**
 * Build and persist a bundle artifact in one step.
 */
export type FileMapBundle = (
  sourceDir: t.StringDir,
  options: FileMapBundleOptions,
) => Promise<FileMapBundleResult>;

/** Options for `bundle` (extends the pure `toMap` options). */
export type FileMapBundleOptions = t.FileMapToMapOptions & {
  /** File path to write the JSON artifact into. */
  readonly targetFile: t.StringPath;
};

/** Result from `bundle`. */
export type FileMapBundleResult = {
  /** The in-memory map (same as returned by `toMap`). */
  readonly fileMap: t.FileMap;
  /** Number of entries in the map. */
  readonly count: number;
  /** Absolute path of the artifact written to disk. */
  readonly path: t.StringPath;
};
