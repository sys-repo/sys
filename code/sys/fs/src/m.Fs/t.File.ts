import type { t } from './common.ts';

/** Filter on file paths. */
export type FsFileFilter = (file: t.FsFile) => boolean;

/**
 * Generator function that produces `FsFile` data-structures.
 */
export type FsFileFactory = (path: t.StringPath, baseDir?: t.StringDir) => t.FsFile;

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
