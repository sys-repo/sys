import type { t } from './common.ts';

/**
 * Templates for generating factory `Catalog` file structures.
 */
export type CatalogTmpl = {
  /** Run in CLI mode. */
  cli(args?: {}): Promise<void>;

  /** Bind template engine to local `/-tmpl/catalog` source. */
  catalog(options?: t.TmplFactoryOptions): t.Tmpl;

  /** Copy the catalog scaffold to `target`. */
  writeCatalog(
    target: t.StringDir,
    opts?: {
      filter?: t.TmplFilter;
      factory?: t.TmplFactoryOptions;
      write?: t.TmplWriteOptions;
    },
  ): Promise<t.TmplWriteResponse>;

  /** Render ops as a console table (useful with dry-run). */
  table(ops: t.TmplFileOperation[], options?: t.TmplLogTableOptions): string;
};
