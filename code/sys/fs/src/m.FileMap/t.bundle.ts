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

  /** Handler called by the bundler immediately before writing to disk. */
  beforeWrite?: t.FileMapBundleBeforeWrite;
};

/** Result from `bundle`. */
export type FileMapBundleResult = {
  /** Number of entries in the map. */
  readonly count: number;
  /** The in-memory map. */
  readonly fileMap: t.FileMap;
  /** Absolute path of the artifact written to disk. */
  readonly file: t.StringPath;
  /** Flag indicating if a `beforeWrite` handler modified the bundle. */
  readonly modified: boolean;
};

/**
 * Handler called by the bundler immediately before writing to disk.
 * Use this to make final modifications to the bundle.
 */
export type FileMapBundleBeforeWrite = (e: FileMapBundleBeforeWriteArgs) => void;
export type FileMapBundleBeforeWriteArgs = {
  /** The in-memory map. */
  readonly fileMap: t.FileMap;
  /** Absolute path of the artifact written to disk. */
  readonly file: t.StringPath;
  /** Signal that a modified version should be written to disk.   */
  modify(next: t.FileMap): void;
};
