import type { t } from './common.ts';

/** ANSI foreground color names supported by the terminal formatter. */
export type AnsiForegroundColorName =
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
export type AnsiForegroundColors = Pick<t.AnsiColors, AnsiForegroundColorName>;

/**
 * CLI color formatting tools.
 */
export type AnsiColorLib = {
  /** Full ANSI formatter surface. */
  readonly ansi: t.AnsiColors;
  /** Foreground color formatters only. */
  readonly foreground: AnsiForegroundColors;
  /** RGB color helpers re-exported for convenience. */
  readonly rgb: t.ColorLib;
};
