/**
 * @module
 * Command-line formatting tools (e.g. color, tree, path).
 */
import { c, Num, Path as StdPath, PathFormat, Str, type t } from '../common.ts';
import { Chapters } from '../m.Fmt.Chapters/mod.ts';
import { Commit } from './m.Fmt.Commit.ts';
import { Help } from './m.Fmt.Help.ts';
import { hr } from './m.Fmt.Hr.ts';
import { spinnerRaw, spinnerText } from './m.Fmt.spinnerText.ts';
import { Tree } from './m.Fmt.Tree.ts';
import { UrlFmt } from './m.Fmt.Url.ts';
import { terminal as isTerminal } from '../m.Is/u.terminal.ts';
import { size as screenSize } from '../m.Screen/u.size.ts';

export const Path: t.CliFormat.Lib['Path'] = {
  str(path) {
    return formatDisplayPath(displayPath(path));
  },
  tty(path, options = {}) {
    const display = displayPath(path);
    const stream = options.stream ?? 'stdout';
    const terminal = options.terminal ?? isTerminal(stream);
    if (!terminal) return formatDisplayPath(display, options);

    const width = numberOr(options.width, screenSize().width);
    const reserve = numberOr(options.reserve, 0);
    const min = numberOr(options.min, 32);
    const max = Math.max(min, width - reserve);
    const shortened = Str.ellipsize(display, max, { ellipsis: ELLIPSIS_SENTINEL });
    const [head, tail] = shortened.split(ELLIPSIS_SENTINEL);
    if (tail === undefined) return formatDisplayPath(display, options);

    return `${formatPathFragment(head, options)}${c.cyan('…')}${formatPathFragment(tail, options)}`;
  },
  fmt(opts = {}) {
    return (e) => {
      if (opts.highlightBasename !== false && e.is.basename) e.change(c.white(e.part));
    };
  },
};

const ELLIPSIS_SENTINEL = '\uE000';

function displayPath(path: string): string {
  const value = path.trim();
  if (value === '' || value === '.') return './';
  if (StdPath.Is.absolute(value)) return value;
  if (value.startsWith('./') || value.startsWith('../')) return value;
  return `./${value}`;
}

function formatDisplayPath(display: string, options: t.CliFormat.Path.FormatOptions = {}): string {
  if (display === './') return c.gray('./');
  return formatPathFragment(display, options);
}

function formatPathFragment(display: string, options: t.CliFormat.Path.FormatOptions): string {
  return c.gray(Fmt.path(display, Fmt.Path.fmt(options)));
}

function numberOr(value: number | undefined, fallback: number): number {
  return Num.Is.finite(value) ? value : fallback;
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
