import { Format as PathFormat } from '@sys/std/path';
import { type t, c } from './common.ts';

export const Fmt: t.CliFormatLib = {
  path: PathFormat.string,
  Path: {
    str: (path) => c.gray(Fmt.path(path, Fmt.Path.fmt())),
    fmt(opts = {}) {
      return (e) => {
        console.log('e.text', e.part);
        console.log('e.toString()', e.toString());
        if (e.is.basename) e.change(c.white(e.part));
      };
    },
  },
};
