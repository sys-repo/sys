import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  /** Tools for converting a Tmpl to console/log output. */
  readonly Log: t.TmplLogLib;

  /** Create a new directory template. */
  create: t.TmplFactory;
};

/**
 * Generator function for a directory Template.
 */
export type TmplFactory = (source: t.StringDir, fn?: t.TmplProcessFile) => t.Tmpl;

/**
 * A template engine.
 */
export type Tmpl = {
  /** The directory containing the source template files. */
  readonly source: t.FsDir;

  /** Perform a copy of the templates to a target directory. */
  copy(target: t.StringDir, options?: t.TmplCopyOptions): Promise<t.TmplCopyResponse>;

  /** Clones the template filtering down to a subset of source files. */
  filter(fn: t.TmplFilter): t.Tmpl;
};

/**
 * A filter on template source files.
 * NB: this differs from "exclude" whereby it filters out any knowledge of the
 *     file's existence in the source directory, however exclude acknowledges the
 *     existence of the file but excludes it from the set of templates that
 *     are copied to the target.
 */
export type TmplFilter = t.FsFileFilter;

/**
 * Handler that runs for each template file being copied.
 * Use this to:
 *  - filter out files (incl. marking as "user-space" exclusions)
 *  - adjust the text content before writing.
 *  - adjust the target filename.
 */
export type TmplProcessFile = (args: TmplProcessFileArgs) => TmplProcessFileResponse;
export type TmplProcessFileResponse = t.IgnoredResponse | Promise<t.IgnoredResponse>;
export type TmplProcessFileArgs = {
  /** The source template file. */
  readonly tmpl: t.FsFile;

  /** The target location being copied to. */
  readonly target: t.FsFile & { exists: boolean };

  /** The text body of the file. */
  readonly text: { tmpl: string; current: string };

  /** Filter out the file from being copied. */
  exclude(reason?: string): TmplProcessFileArgs;

  /** Adjust the name of the file. */
  rename(filename: string): TmplProcessFileArgs;

  /** Adjust the text within the file. */
  modify(text: string): TmplProcessFileArgs;
};

/** Options passed to the `tmpl.copy` method. */
export type TmplCopyOptions = {
  /** Flag indicating if the copy operation should be forced. (NB: "excluded" paths will never be written). */
  force?: boolean;
  /** Flag indicating if the files should be written. Default: true (pass false for a "dry-run"). */
  write?: boolean;
};

/**
 * The reponse returned from the `tmpl.copy` method.
 */
export type TmplCopyResponse = {
  readonly source: t.FsDir;
  readonly target: t.FsDir;
  readonly ops: t.TmplFileOperation[];
};

/**
 * Details about a file update.
 */
export type TmplFileOperation = {
  /** If excluded, contains the reason for the exclusion, otherwise `boolean` flag. */
  excluded: boolean | { reason: string };

  /** Flag indicating if a write operation was performed for the file. */
  written: boolean;

  /** Flag indicating if the write operation was a "create" action */
  created: boolean;

  /** Flag indicating if the write operation was the "update" action. */
  updated: boolean;

  /** Flag indicating if the file operation was forced. */
  forced: boolean;

  /** File path details. */
  file: { tmpl: t.FsFile; target: t.FsFile };

  /** The text content of the file. */
  text: {
    tmpl: string;
    target: { before: string; after: string; isDiff: boolean };
  };
};
