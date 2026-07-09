import type { t } from './common.ts';

/**
 * ANSI color helper types.
 */
export declare namespace AnsiColor {
  /** CLI color formatting tools. */
  export type Lib = {
    /** Full ANSI formatter surface. */
    readonly ansi: t.AnsiColors;
    /** Foreground color formatters only. */
    readonly foreground: Foreground;
    /** Raw ANSI escape sequences. */
    readonly escape: Escape;
    /** RGB color helpers re-exported for convenience. */
    readonly rgb: t.Color.Lib;
  };

  /** ANSI color names supported by the terminal formatter. */
  export type Name =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'gray'
    | 'brightBlack'
    | 'brightRed'
    | 'brightGreen'
    | 'brightYellow'
    | 'brightBlue'
    | 'brightMagenta'
    | 'brightCyan'
    | 'brightWhite';

  /** ANSI foreground formatter subset keyed by color name. */
  export type Foreground = Pick<t.AnsiColors, Name>;

  /** Raw ANSI escape sequences. */
  export type Escape = {
    readonly reset: string;
    readonly italic: string;
    readonly bold: string;
    readonly underline: string;
  };
}
