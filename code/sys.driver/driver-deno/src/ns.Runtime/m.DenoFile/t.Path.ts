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
export type DenoFileNearestStopArgs = {
  readonly path: t.StringAbsolutePath;
  readonly file: t.DenoFileJson;
};
