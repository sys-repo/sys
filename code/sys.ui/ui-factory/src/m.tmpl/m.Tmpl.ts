// import { Tmpl as Template } from '@sys/tmpl/fs';
import { type t, TmplEngine } from './common.ts';
import { cli } from './u.cli.ts';

/**
 * Templates for generating factory `Catalog` file structures.
 */
const SRC_DIR = new URL('../-tmpl/catalog/', import.meta.url).pathname as t.StringDir;

export const Tmpl: t.CatalogTmpl = {
  cli,

  /** Return a template engine bound to the local `/-tmpl/catalog` source. */
  catalog(options?: t.TmplFactoryOptions) {
    return TmplEngine.create(SRC_DIR, options);
  },

  /**
   * One-shot helper: copy the catalog scaffold to `target`.
   * - Pass `factory.processFile` if you need per-file transforms/exclusions.
   * - Use `filter` to restrict the copied set.
   * - `write.ctx` is forwarded to `processFile`.
   */
  async writeCatalog(
    target: t.StringDir,
    opts?: {
    },
  ): Promise<t.TmplWriteResponse> {
    const base = TmplEngine.create(SRC_DIR, opts?.factory);
    const engine = opts?.filter ? base.filter(opts.filter) : base;
    return engine.write(target, opts?.write);
  },

  /** Pretty-print file operations (useful with `dryRun: true`). */
  table: TmplEngine.Log.table,
} satisfies t.CatalogTmpl;
