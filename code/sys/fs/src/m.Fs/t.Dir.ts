import type { t } from './common.ts';

/**
 * Generator function that produces `FsDir` data-structures.
 */
export type FsDirFactory = (
  dir: t.StringDir,
  options?: t.FsDirFactoryOptions | t.FsFileFilter | t.FsFileFilter[],
) => t.FsDir;

/** Options used when creating an `FsDir`. */
export type FsDirFactoryOptions = {
  filter?: t.FsFileFilter | t.FsFileFilter[];
};

/**
 * An object representing a directory path.
 */
export type FsDir = {
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
