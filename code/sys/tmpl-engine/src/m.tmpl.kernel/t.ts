import type { t } from '../m.tmpl/common.ts';

/**
 * Kernel surface: build and run template operations.
 */
export type TmplKernel = {
  /** Generate a JSON bundle from a source directory. */
  bundle(args: TmplBundleArgs): Promise<{ fileMap: t.FileMap; outFile: string; count: number }>;

  /** Copy the scaffold to `target` (or temp dir if `dryRun`). */
  write(target: t.StringDir, opts?: TmplRunOptions): Promise<t.TmplWriteResponse>;

  /** Render a table of operations. */
  table(ops: t.TmplFileOperation[], options?: t.TmplLogTableOptions): string;
};

/** Inputs for constructing the kernel. */
export type TmplMakeArgs = {
  readonly sourceDir?: string;

  /** Return a validated file map (throw if invalid). */
  readonly loadFileMap: () => Promise<t.FileMap>;

  /** Optional per-run transform (eg. bundleRoot strip, renames, text transforms). */
  readonly makeProcessFile?: (opts?: {
    bundleRoot?: t.StringDir;
  }) => t.FileMapProcessFile | undefined;
};

/** Create a kernel from host-provided args. */
export type MakeTmplFunction = (args: TmplMakeArgs) => TmplKernel;

/** Options for `write`. */
export type TmplRunOptions = {
  readonly dryRun?: boolean;
  readonly bundleRoot?: string;
};

/** Options for `bundle`. */
export type TmplBundleArgs = {
  readonly srcDir: string;
  readonly outFile: string;

  /** Optional filter for including entries. */
  readonly filter?: t.FileMapBundleFilter;

  /** Optional key-sort; defaults to lexicographic order. */
  readonly sortKeys?: (keys: readonly string[]) => readonly string[];
};
