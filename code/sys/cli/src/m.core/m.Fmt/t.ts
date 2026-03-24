import type { t } from '../common.ts';
import type { AnsiForegroundColorName } from '@sys/color/t';
import type { CliFormatHelpLib } from './t.help.ts';

/** Type re-exports. */
export type * from './t.help.ts';

/**
 * Common formatting helpers when working with a CLI.
 */
export type CliFormatLib = {
  /** Horizontal rule display formatting. */
  hr: CliFormatHr;

  /** Help page formatting. */
  readonly Help: CliFormatHelpLib;

  /** Path display formatting. */
  path: t.PathFormatLib['string'];

  /** Common CLI pretty path formatting */
  readonly Path: {
    str: (path: string) => string;
    fmt: (opts?: {}) => t.PathFormatter;
  };

  /** Glyphs for representing a tree hierarchy */
  readonly Tree: {
    readonly vert: '│';
    readonly mid: '├';
    readonly last: '└';
    readonly bar: '─';
    branch(isLastOrTuple: boolean | [t.Index, t.Ary<unknown>], extend?: number): string;
  };
};

/**
 * Foreground color name accepted by the horizontal rule formatter.
 */
export type CliFormatHrColor = AnsiForegroundColorName;

/**
 * Horizontal rule formatter.
 *
 * Supported call forms:
 * - `hr()`
 * - `hr(width)`
 * - `hr(color)`
 * - `hr(width, color)`
 */
export type CliFormatHr = {
  (): string;
  (width: number): string;
  (color: CliFormatHrColor): string;
  (width: number, color: CliFormatHrColor): string;
};
