import type { t } from './common.ts';

/**
 * Templates for generating factory `Catalog` file structures.
 */
export type CatalogTmplLib = {
  /** Run in CLI mode. */
  cli(args?: { dryRun?: boolean }): Promise<void>;

  /** Copy the catalog scaffold to `target`. */
  write(target: t.StringDir, opts?: CatalogTmplWriteOptions): Promise<t.TmplWriteResponse>;

  /** Render ops as a console table (useful with dry-run). */
  table(ops: t.TmplFileOperation[], options?: t.TmplLogTableOptions): string;
};

/**
 * CLI args for running the catalog template.
 */
export type CatalogTmplCliArgs = { readonly dryRun?: boolean };

/**
 * Options when binding the template engine to local sources.
 * (Alias to your existing factory options to keep call-sites consistent.)
 */
export type CatalogTmplTmplOptions = t.TmplFactoryOptions;

/**
 * Options when writing the scaffold to a target directory.
 */
export type CatalogTmplWriteOptions = { readonly dryRun?: boolean };
