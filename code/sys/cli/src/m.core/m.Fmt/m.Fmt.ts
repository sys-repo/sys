/**
 * @module
 * Command-line formatting tools (e.g. color, tree, path).
 */
import { type t, c, Path as StdPath, PathFormat } from '../common.ts';
import { Chapters } from '../m.Fmt.Chapters/mod.ts';
import { Commit } from './m.Fmt.Commit.ts';
import { Help } from './m.Fmt.Help.ts';
import { hr } from './m.Fmt.Hr.ts';
import { spinnerRaw, spinnerText } from './m.Fmt.spinnerText.ts';
import { Tree } from './m.Fmt.Tree.ts';
import { UrlFmt } from './m.Fmt.Url.ts';

export const Path: t.CliFormat.Lib['Path'] = {
  str(path) {
    const display = displayPath(path);
    if (display === './') return c.gray('./');
    return c.gray(Fmt.path(display, Fmt.Path.fmt()));
  },
  fmt(_opts = {}) {
    return (e) => {
      if (e.is.basename) e.change(c.white(e.part));
    };
  },
};

function displayPath(path: string): string {
  const value = path.trim();
  if (value === '' || value === '.') return './';
  if (StdPath.Is.absolute(value)) return value;
  if (value.startsWith('./') || value.startsWith('../')) return value;
  return `./${value}`;
}

/** Command-line formatting helper library. */
export const Fmt: t.CliFormat.Lib = {
  hr,
  Commit,
  Help,
  Chapters,
  Tree,
  Path,
  Url: UrlFmt,
  path: PathFormat.string,
  spinnerRaw,
  spinnerText,
};
