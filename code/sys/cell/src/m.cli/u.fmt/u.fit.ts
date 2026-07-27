import { c, Cli, Str } from '../common.ts';

export type FitTextOptions = {
  readonly color?: (text: string) => string;
};

export type FitValueOptions = FitTextOptions & {
  readonly terminal?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
};

export type FitPathOptions = {
  readonly relative?: 'bare' | 'prefixed';
  readonly terminal?: boolean;
  readonly width?: number;
  readonly min?: number;
};

export const FmtFit = {
  text,
  value,
  path,
  valueWidth,
} as const;

/**
 * Helpers:
 */
const ELLIPSIS_SENTINEL = '\uE000';

function text(value: string, width: number, options: FitTextOptions = {}): string {
  const color = options.color ?? c.white;
  if (width <= 0) return '';

  const shortened = Str.ellipsize(value, width, { ellipsis: ELLIPSIS_SENTINEL });
  const [head, ...tail] = shortened.split(ELLIPSIS_SENTINEL);
  if (tail.length === 0) return color(shortened);

  return [color(head), ...tail.map((part) => `${c.cyan('…')}${color(part)}`)].join('');
}

function value(value: string, reserve: number, options: FitValueOptions = {}): string {
  const color = options.color ?? c.white;
  const terminal = options.terminal ?? Cli.Is.terminal('stdout');
  if (!terminal) return color(value);

  return text(value, valueWidth(reserve, { ...options, terminal }), { color });
}

function path(path: string, reserve: number, options: FitPathOptions = {}): string {
  return Cli.Fmt.Path.tty(path, {
    reserve,
    relative: options.relative,
    terminal: options.terminal ?? Cli.Is.terminal('stdout'),
    width: options.width ?? Cli.Screen.size().width,
    min: options.min ?? 1,
    highlightBasename: false,
  });
}

function valueWidth(reserve: number, options: FitValueOptions = {}): number {
  return Cli.Fmt.Text.Width.fit({
    reserve,
    terminal: options.terminal ?? Cli.Is.terminal('stdout'),
    width: options.width ?? Cli.Screen.size().width,
    minWidth: options.minWidth ?? 1,
  });
}
