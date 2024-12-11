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
export type TmplProcessFile = (args: TmplProcessFileArgs) => void | Promise<void>;
export type TmplProcessFileArgs = {
  /** Details of the file being processed. */
  readonly file: TmplFile;
  /** The text body of the file. */
  readonly text: string;
  /** Filter out the file from being copied. */
  exclude(reason: string): TmplProcessFileArgs;
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
  readonly operations: t.TmplOperation[];
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
export type TmplOperation = {
  /** The kind of file operation that occured. */
  action: 'Created' | 'Updated' | 'Unchanged';
  /** The source file details. */
  source: t.TmplFile;
  /** The target file details. */
  target: t.TmplFile;
  /** The text body of the file. */
  text: { from: string; to: string };
  /** If excluded, contains the reason for the exclusion, otherwise `undefined`. */
  excluded?: string;
};
