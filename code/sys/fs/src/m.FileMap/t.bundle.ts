import { type t } from './common.ts';

/**
 * Build a FileMap from a directory then write a single JSON artifact to a file.
 */
export type FileMapBundle = (
  sourceDir: t.StringDir,
  options: FileMapBundleOptions | FileMapBundleOptions['targetFile'],
) => Promise<FileMapBundleResult>;

/** Options for `bundle` (extends the pure `toMap` options). */
export type FileMapBundleOptions = t.FileMapToMapOptions & {
  /** File path to write the JSON artifact into. */
  readonly targetFile: t.StringPath;
};

/** Result from `bundle`. */
export type FileMapBundleResult = {
  /** Number of entries in the map. */
  readonly count: number;
  /** The in-memory map (same as returned by `toMap`). */
  readonly fileMap: t.FileMap;
  /** Absolute path of the artifact written to disk. */
  readonly file: t.StringPath;
};
