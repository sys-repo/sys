/**
 * @module
 * Command-line formatting tools (e.g. color, tree, path).
 */
import { c, Num, Path as StdPath, Str, type t } from '../common.ts';
import { Chapters } from '../m.Fmt.Chapters/mod.ts';
import { Commit } from './m.Fmt.Commit.ts';
import { Help } from './m.Fmt.Help.ts';
import { hr } from './m.Fmt.Hr.ts';
import { spinnerRaw, spinnerText } from './m.Fmt.spinnerText.ts';
import { Text } from '../m.Fmt.Text/mod.ts';
import { Tree } from './m.Fmt.Tree.ts';
import { UrlFmt } from './m.Fmt.Url.ts';
import { terminal as isTerminal } from '../m.Is/u.terminal.ts';
import { size as screenSize } from '../m.Screen/u.size.ts';

export const Path: t.CliFormat.Path.Lib = {
  str(path, options = {}) {
    return formatDisplayPath(displayPath(path, options), options);
  },
  tty(path, options = {}) {
    const display = displayPath(path, options);
    const stream = options.stream ?? 'stdout';
    const terminal = options.terminal ?? isTerminal(stream);
    const fit = options.fit ?? 'terminal';
    if (fit === 'terminal' && !terminal) return formatDisplayPath(display, options);

    const width = numberOr(options.width, screenSize().width);
    const reserve = numberOr(options.reserve, 0);
    const min = numberOr(options.min, 32);
    const max = Math.max(min, width - reserve);
    const shortened = Str.ellipsize(display, max, { ellipsis: ELLIPSIS_SENTINEL });
    const [head, tail] = shortened.split(ELLIPSIS_SENTINEL);
    if (tail === undefined) return formatDisplayPath(display, options);

    const ellipsis = formatEllipsis(options);
    return `${formatPathFragment(head, options)}${ellipsis}${formatPathFragment(tail, options)}`;
  },
  fmt(opts = {}) {
    return (e) => {
      if (opts.highlightBasename !== false && e.is.basename) e.change(c.white(e.part));
    };
  },
};

const ELLIPSIS_SENTINEL = '\uE000';

function displayPath(path: string, options: t.CliFormat.Path.FormatOptions = {}): string {
  const value = path.trim();
  const relative = options.relative ?? 'prefixed';

  if (value === '') return './';
  if (value === '.') return relative === 'bare' ? '.' : './';
  if (StdPath.Is.absolute(value)) return value;
  if (value.startsWith('./') || value.startsWith('../')) return value;
  return relative === 'bare' ? value : `./${value}`;
}

function formatDisplayPath(display: string, options: t.CliFormat.Path.FormatOptions = {}): string {
  if (display === './') return colorPath('./', options);
  return formatPathFragment(display, options);
}

function formatPathFragment(display: string, options: t.CliFormat.Path.FormatOptions): string {
  return colorPath(Fmt.path(display, Fmt.Path.fmt(options)), options);
}

function formatEllipsis(options: t.CliFormat.Path.FormatOptions): string {
  return options.tone === 'muted' ? colorPath('…', options) : c.cyan('…');
}

function colorPath(text: string, options: t.CliFormat.Path.FormatOptions): string {
  const color = c.gray(text);
  return options.tone === 'muted' ? c.dim(color) : color;
}

function numberOr(value: number | undefined, fallback: number): number {
  return Num.Is.finite(value) ? value : fallback;
}

/** Command-line formatting helper library. */
export const Fmt: t.CliFormat.Lib = {
  hr,
  Commit,
  Help,
  Text,
  Chapters,
  Tree,
  Path,
  Url: UrlFmt,
  path: StdPath.Format.string,
  spinnerRaw,
  spinnerText,
};
