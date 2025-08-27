import type { t } from './common.ts';

/**
 * Templates for generating factory `Catalog` file structures.
 */
export type CatalogTmplLib = {
  /** Run in CLI mode. */
  cli(args?: { dryRun?: boolean }): Promise<void>;

  /** Bind template engine to local `/-tmpl/catalog` source. */
  tmpl(options?: t.TmplFactoryOptions): t.Tmpl;

  /** Copy the catalog scaffold to `target`. */
  write(target: t.StringDir, opts?: { dryRun?: boolean }): Promise<t.TmplWriteResponse>;

  /** Render ops as a console table (useful with dry-run). */
  table(ops: t.TmplFileOperation[], options?: t.TmplLogTableOptions): string;
};
