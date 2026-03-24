import type { t } from './common.ts';

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

export type AnsiForegroundColors = Pick<t.AnsiColors, AnsiForegroundColorName>;

/**
 * CLI color formatting tools.
 */
export type AnsiColorLib = {
  readonly ansi: t.AnsiColors;
  readonly foreground: AnsiForegroundColors;
  readonly rgb: t.ColorLib;
};
