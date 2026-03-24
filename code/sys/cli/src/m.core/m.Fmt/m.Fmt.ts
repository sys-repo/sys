/**
 * @module
 * Command-line formatting tools (e.g. color, tree, path).
 */
import { Format as PathFormat } from '@sys/std/path';
import { type t, c } from '../common.ts';
import { hr } from './m.Fmt.Hr.ts';
import { Tree } from './m.Fmt.Tree.ts';

export const Path: t.CliFormatLib['Path'] = {
  str: (path) => c.gray(Fmt.path(path, Fmt.Path.fmt())),
  fmt(opts = {}) {
    return (e) => {
      if (e.is.basename) e.change(c.white(e.part));
    };
  },
};

/** Command-line formatting helper library. */
export const Fmt: t.CliFormatLib = {
  hr,
  Tree,
  Path,
  path: PathFormat.string,
};
