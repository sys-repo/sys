import { type t, TmplEngine } from './common.ts';
import { cli } from './u.cli.ts';
import { write } from './u.write.ts';

const SRC_DIR = new URL('../-tmpl/catalog-react/', import.meta.url).pathname as t.StringDir;

export const Tmpl: t.CatalogTmplLib = {
  cli,
  write,
  table: TmplEngine.Log.table,
  tmpl(options) {
    return TmplEngine.create(SRC_DIR, options);
  },
} satisfies t.CatalogTmplLib;
