import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  /** Tools for converting a Tmpl to console/log output. */
  readonly Log: t.TmplLogLib;
  /** Create a new directory template. */
  create: TmplFactory;
};

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
  /** Details of the file being processed. */
  readonly file: { readonly source: t.TmplFile; readonly target: t.TmplFile & { exists: boolean } };
  /** The text body of the file. */
  readonly text: string;
  /** Filter out the file from being copied. */
  exclude(reason?: string): TmplProcessFileArgs;
  /** Adjust the name of the file. */
  rename(filename: string): TmplProcessFileArgs;
  /** Adjust the text within the file. */
  modify(text: string): TmplProcessFileArgs;
};

/**
 * Generator function for a directory Template.
 */
export type TmplFactory = (source: t.StringDir, fn?: t.TmplProcessFile) => t.Tmpl;

/**
 * A template copier.
 */
export type Tmpl = {
  /** The directory containing the source template files. */
  readonly source: t.TmplDir;
  /** Perform a copy of the templates to a target directory. */
  copy(target: t.StringDir, options?: { force?: boolean }): Promise<t.TmplCopyResponse>;
};

/**
 * The reponse returned from the `tmpl.copy` method.
 */
export type TmplCopyResponse = {
  readonly source: t.TmplDir;
  readonly target: t.TmplDir;
  readonly ops: t.TmplFileOperation[];
};

/**
 * A directory involved in a [Tmpl] configuration.
 */
export type TmplDir = {
  dir: t.StringDir;
  ls(trimCwd?: boolean): Promise<t.StringPath[]>;
};

/**
 * Path details about a template file.
 */
export type TmplFile = {
  cwd: t.StringDir;
  path: t.StringPath;
  dir: string;
  name: string;
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
  file: {
    source: t.TmplFile;
    target: t.TmplFile;
  };
  /** The text content of the file. */
  text: {
    source: string;
    target: { before: string; after: string };
  };
};
