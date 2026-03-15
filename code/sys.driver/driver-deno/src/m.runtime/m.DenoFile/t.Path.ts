import type { t } from '../common.ts';
export type * from './t.Workspace.ts';

/**
 * Helpers for wrangling `deno.json` file paths.
 */
export type DenoFilePathLib = {
  /**
   * Walks up from the starting path looking for the nearest
   * ancestor `deno.json` file.
   */
  nearest(
    start: t.StringPath,
    shouldStop?: t.DenoFileNearestStop,
  ): Promise<t.StringAbsolutePath | undefined>;
};

/** Callback used to keep traversing up the ancestor hierarachy looking for a specific `deno.json` file. */
export type DenoFileNearestStop = (e: t.DenoFileNearestStopArgs) => boolean | Promise<boolean>;
/** Arguments passed to the nearest-file stop callback. */
export type DenoFileNearestStopArgs = {
  /** Absolute path of the candidate `deno.json` file. */
  readonly path: t.StringAbsolutePath;
  /** Parsed contents of the candidate `deno.json` file. */
  readonly file: t.DenoFileJson;
};
