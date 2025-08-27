import { type t, TmplEngine } from './common.ts';
import { cli } from './u.cli.ts';

const SRC_DIR = new URL('../-tmpl/catalog-react/', import.meta.url).pathname as t.StringDir;

export const Tmpl: t.CatalogTmplLib = {
  cli,
  table: TmplEngine.Log.table,

  tmpl(options) {
    return TmplEngine.create(SRC_DIR, options);
  },

  async write(target, opts = {}): Promise<t.TmplWriteResponse> {
    const write = { dryRun: !!opts.dryRun, force: false } as const;
    return Tmpl.tmpl().write(target, write);
  },
} satisfies t.CatalogTmplLib;
