import type { t } from './common.ts';


/**
 * A directory involved in a [Tmpl] configuration.
 */
export type TmplDir = {
  /** The the canonical directory location. */
  absolute: t.StringAbsoluteDir;

  /** Joins a sequence of paths to the directory (ie. sub-folders). */
  join(...parts: t.StringPath[]): t.StringAbsolutePath;

  /** List the file paths within directory. */
  ls(trimCwd?: boolean): Promise<t.StringAbsolutePath[]>;

  /** Convert to string: `dir.absolute` */
  toString(): string;
};

/**
 * Path details about a template file.
 */
export type TmplFile = {
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
