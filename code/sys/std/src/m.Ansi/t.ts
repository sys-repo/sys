import type { t } from './common.ts';

/**
 * Wraps the given text in an [ANSI] color wrapper.
 */
export type WrapAnsiColor = (text: string) => string;

// 24-bit RGB tuple used by rgb24/bgRgb24 helpers.
export type Rgb = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

/**
 * Index of ANSI color-wrapping methods.
 */
export type AnsiColors = {
  /**
   * Enable/disable coloring at runtime (mirrors the underlying lib’s toggle).
   */
  readonly setColorEnabled: (value: boolean) => void;
  readonly getColorEnabled: () => boolean;

  // styles
  readonly reset: WrapAnsiColor;
  readonly bold: WrapAnsiColor;
  readonly dim: WrapAnsiColor;
  readonly italic: WrapAnsiColor;
  readonly underline: WrapAnsiColor;
  readonly inverse: WrapAnsiColor;
  readonly hidden: WrapAnsiColor;
  readonly strikethrough: WrapAnsiColor;

  // 16-color (foreground)
  readonly black: WrapAnsiColor;
  readonly red: WrapAnsiColor;
  readonly green: WrapAnsiColor;
  readonly yellow: WrapAnsiColor;
  readonly blue: WrapAnsiColor;
  readonly magenta: WrapAnsiColor;
  readonly cyan: WrapAnsiColor;
  readonly white: WrapAnsiColor;
  readonly gray: WrapAnsiColor;
  readonly brightBlack: WrapAnsiColor;
  readonly brightRed: WrapAnsiColor;
  readonly brightGreen: WrapAnsiColor;
  readonly brightYellow: WrapAnsiColor;
  readonly brightBlue: WrapAnsiColor;
  readonly brightMagenta: WrapAnsiColor;
  readonly brightCyan: WrapAnsiColor;
  readonly brightWhite: WrapAnsiColor;

  // 16-color (background)
  readonly bgBlack: WrapAnsiColor;
  readonly bgBlue: WrapAnsiColor;
  readonly bgCyan: WrapAnsiColor;
  readonly bgGreen: WrapAnsiColor;
  readonly bgMagenta: WrapAnsiColor;
  readonly bgRed: WrapAnsiColor;
  readonly bgWhite: WrapAnsiColor;
  readonly bgYellow: WrapAnsiColor;
  readonly bgBrightBlack: WrapAnsiColor;
  readonly bgBrightBlue: WrapAnsiColor;
  readonly bgBrightCyan: WrapAnsiColor;
  readonly bgBrightGreen: WrapAnsiColor;
  readonly bgBrightMagenta: WrapAnsiColor;
  readonly bgBrightRed: WrapAnsiColor;
  readonly bgBrightWhite: WrapAnsiColor;
  readonly bgBrightYellow: WrapAnsiColor;

  // 8-bit / 24-bit helpers
  readonly rgb8: (str: string, color: number) => string;
  readonly bgRgb8: (str: string, color: number) => string;
  readonly rgb24: (str: string, color: number | Rgb) => string;
  readonly bgRgb24: (str: string, color: number | Rgb) => string;

  // utils
  readonly stripAnsiCode: (str: string) => string;
};
