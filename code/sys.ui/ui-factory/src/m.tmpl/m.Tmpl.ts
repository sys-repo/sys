import { type t, TmplEngine } from './common.ts';
import { cli } from './u.cli.ts';
import { write } from './u.write.ts';

export const Tmpl: t.CatalogTmplLib = {
  cli,
  write,
  table: TmplEngine.Log.table,
} satisfies t.CatalogTmplLib;
