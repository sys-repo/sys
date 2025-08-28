import { type t } from './common.ts';

/**
 * Formatting tools related to filesystem artefacts.
 */
export type FsFmtLib = {
  /** Render a tree from a list of POSIX-style relative paths ('a/b/c.txt'). */
  tree(paths: readonly string[], options?: FsTreeOptions): string;

  /** Walk a directory and render a tree (paths are made relative to dir). */
  treeFromDir(dir?: t.StringDir, options?: FsTreeOptions): Promise<string>;
};

/** Options passed to the tree formatter. */
export type FsTreeOptions = {
  /** Trim this absolute prefix from displayed paths (usually the dir root). */
  readonly trimPathLeft?: string;
  /** Label to show at the top of the tree (eg. 'catalog/'). */
  readonly label?: string;
  /** Max depth to render (1 = only top-level). Omit for unlimited. */
  readonly maxDepth?: number;
  /** Indent from the left */
  readonly indent?: number;
};
