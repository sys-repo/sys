import { type t } from './common.ts';

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
