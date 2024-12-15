import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  create(source: t.StringDir, fn?: t.TmplProcessFile): Tmpl;
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
  readonly file: { readonly source: t.TmplFile; readonly target: t.TmplFile };
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
 * A template copier.
 */
export type Tmpl = {
  readonly source: t.TmplDir;
  copy(target: t.StringDir): Promise<t.TmplCopyResponse>;
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
  ls(): Promise<t.StringPath[]>;
};

/**
 * Details about a template file.
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
