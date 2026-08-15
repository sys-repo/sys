import { c, Cli } from '../common.ts';

export type FitTextOptions = {
  color?: (text: string) => string;
};

export type FitValueOptions = FitTextOptions & {
  terminal?: boolean;
  width?: number;
  minWidth?: number;
};

export type FitPathOptions = {
  relative?: 'bare' | 'prefixed';
  terminal?: boolean;
  width?: number;
  min?: number;
};

export type FitContext = {
  readonly terminal: boolean;
  readonly width: number;
};

export function currentFitContext(): FitContext {
  return {
    terminal: Cli.Is.terminal('stdout'),
    width: Cli.Screen.size().width,
  };
}

export const FmtFit = Object.freeze(
  {
    text,
    value,
    path,
    valueWidth,
  } as const,
);

/**
 * Helpers:
 */
function text(value: string, width: number, options: FitTextOptions = {}): string {
  const color = options.color ?? c.white;
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(value) <= width) return color(value);

  return Cli.Fmt.Text.ellipsize(value, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${color(head)}${c.cyan(ellipsis)}${color(tail)}`;
    },
  });
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
