/**
 * @module
 * Command-line formatting tools (e.g. color, tree, path).
 */
import { c, Num, Path as StdPath, type t } from '../common.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';
import { terminal as isTerminal } from '../../m.Is/u.terminal.ts';
import { size as screenSize } from '../../m.Screen/u.size.ts';
import { omission } from '../u/u.omission.ts';

export const Path: t.CliFormat.Path.Lib = Object.freeze({
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
    if (Text.Width.measure(display) <= max) return formatDisplayPath(display, options);

    const formatFragment = (text: string) => text ? formatPathFragment(text, options) : '';
    return Text.ellipsize(display, max, {
      render: ({ head, ellipsis, tail }) => {
        return `${formatFragment(head)}${omission(ellipsis)}${formatFragment(tail)}`;
      },
    });
  },
  fmt(opts = {}) {
    return (e) => {
      if (opts.highlightBasename !== false && e.is.basename) e.change(c.white(e.part));
    };
  },
});

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
  return colorPath(StdPath.Format.string(display, Path.fmt(options)), options);
}

function colorPath(text: string, options: t.CliFormat.Path.FormatOptions): string {
  const color = c.gray(text);
  return options.tone === 'muted' ? c.dim(color) : color;
}

function numberOr(value: number | undefined, fallback: number): number {
  return Num.Is.finite(value) ? value : fallback;
}
