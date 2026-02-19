/**
 * @module
 * Command-line formatting tools (e.g. color, trees, table).
 */
import { Format as PathFormat } from '@sys/std/path';
import { type t, c } from './common.ts';
import { Table } from './m.Table.ts';
import { Tree } from './m.Fmt.Tree.ts';

export { c, Color, stripAnsi } from '../common.ts';

export const Path: t.CliFormatLib['Path'] = {
  str: (path) => c.gray(Fmt.path(path, Fmt.Path.fmt())),
  fmt(opts = {}) {
    return (e) => {
      if (e.is.basename) e.change(c.white(e.part));
    };
  },
};

export const Fmt: t.CliFormatLib = {
  Table,
  Tree,
  Path,
  path: PathFormat.string,
};
