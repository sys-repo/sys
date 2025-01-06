import type { t } from './common.ts';


/**
 * An object representing a directory path.
 */
export type FsDir = {
  /** The conceptual root from which relative paths are computed. */
  // readonly base: t.StringAbsoluteDir;

  /** The the canonical directory location. */
  absolute: t.StringAbsoluteDir;

  /** Joins a sequence of paths to the directory (ie. sub-folders). */
  join(...parts: t.StringPath[]): t.StringAbsolutePath;

  /** List the file paths within directory. */
  ls(options?: t.FsDirListOptions | t.FsFileFilter): Promise<t.StringPath[]>;

  /** Convert to string: `dir.absolute` */
  toString(): string;
};

/** Options passed to the `Dir.ls` method. */
export type FsDirListOptions = {
  trimCwd?: boolean;
  filter?: t.FsFileFilter;
};

/**
 * Path details about a template file.
 */
export type FsFile = {
  /** The conceptual root from which relative paths are computed. */
  readonly base: t.StringAbsoluteDir;

  /** The the canonical file location. */
  readonly absolute: t.StringAbsolutePath;

  /** The relative path starting at `base`. */
  readonly relative: t.StringRelativePath;

  /** The relative directory starting at `base`.  */
  readonly dir: t.StringRelativeDir;

  /** Details of the filename. */
  readonly file: { readonly name: string; readonly ext: string };

  /** Convert to string: `file.absolute` */
  toString(): string;
};

/**
 * Filter on file paths.
 */
export type FsFileFilter = (file: t.FsFile) => boolean;
