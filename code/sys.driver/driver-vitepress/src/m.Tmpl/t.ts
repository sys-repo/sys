import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  create(source: t.StringDir, target: t.StringDir, fn?: t.TmplProcessFile): Tmpl;
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
  readonly file: TmplFile;
  readonly change: {
    filename(text: string): TmplProcessFileArgs;
    body(text: string): TmplProcessFileArgs;
  };
  exclude(reason: string): TmplProcessFileArgs;
};

/**
 * A template copier.
 */
export type Tmpl = {
  readonly source: t.TmplDir;
  readonly target: t.TmplDir;
  copy(): Promise<t.TmplCopyResponse>;
};

export type TmplCopyResponse = {
  readonly operations: t.TmplFileOperation[];
};

/**
 * A directory involved in a [Tmpl] configuration.
 */
export type TmplDir = {
  readonly dir: t.StringDir;
  ls(): Promise<t.StringPath[]>;
};

/**
 * Details about a template file.
 */
export type TmplFile = {
  readonly cwd: t.StringDir;
  readonly path: t.StringPath;
  readonly dir: string;
  readonly name: string;
};

/**
 * Details about a file update.
 */
export type TmplFileOperation = {
  /** The file path details */
  readonly file: t.TmplFile;

  /** The kind of file operation that occured. */
  readonly kind: 'Created' | 'Updated' | 'Unchanged';

  /** Contains a value if excluded, which is the reason for the exclusion, otherwise [undefined]. */
  excluded?: string;
};
