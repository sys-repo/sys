import type { t } from '../common.ts';
import type { AnsiForegroundColorName } from '@sys/color/t';
import type { CliFormatCommitLib } from './t.commit.ts';
import type { CliFormatHelpLib } from './t.help.ts';

/** Type re-exports. */
export type * from './t.commit.ts';
export type * from './t.help.ts';

/**
 * Common formatting helpers when working with a CLI.
 */
export type CliFormatLib = {
  /** Horizontal rule display formatting. */
  hr: CliFormat.Hr.Fn;

  /** Common spinner status text formatting. */
  spinnerText: CliFormatSpinnerText;

  /** Spinner spacing wrapper for text that is already fully formatted. */
  spinnerRaw: CliFormatSpinnerText;

  /** Help page formatting. */
  readonly Help: CliFormatHelpLib;

  /** Commit message suggestion formatting. */
  readonly Commit: CliFormatCommitLib;

  /** Path display formatting. */
  path: t.PathFormatLib['string'];

  /** Pretty path formatting helpers. */
  readonly Path: {
    str: (path: string) => string;
    fmt: (opts?: {}) => t.PathFormatter;
  };

  /** Glyphs and helpers for rendering a tree hierarchy. */
  readonly Tree: {
    readonly vert: '│';
    readonly mid: '├';
    readonly last: '└';
    readonly bar: '─';
    branch(isLastOrTuple: boolean | [t.Index, t.Ary<unknown>], extend?: number): string;
  };
};

/**
 * CLI formatting helper types.
 */
export declare namespace CliFormat {
  export namespace Spinner {
    export type Spacing = boolean | number | [number, number];
  }

  export namespace Hr {
    /** Foreground color name accepted by the horizontal rule formatter. */
    export type Color = AnsiForegroundColorName;

    /** Horizontal rule formatting options. */
    export type Options = {
      /** Explicit rule width. Omit to use the current screen width. */
      readonly width?: number;
      /** Optional rule foreground color. */
      readonly color?: Color;
    };

    /**
     * Horizontal rule formatter.
     *
     * Supported call forms:
     * - `hr()`
     * - `hr(width)`
     * - `hr(color)`
     * - `hr(width, color)`
     * - `hr(options)`
     */
    export type Fn = {
      (): string;
      (width: number): string;
      (color: Color): string;
      (width: number, color: Color): string;
      (options: Options): string;
    };
  }
}

/** Spacing input accepted by spinner text helpers. */
export type CliFormatSpinnerSpacing = CliFormat.Spinner.Spacing;

/** Spinner text formatter signature. */
export type CliFormatSpinnerText = {
  (text: string): string;
  (text: string, spacing: CliFormatSpinnerSpacing): string;
};
