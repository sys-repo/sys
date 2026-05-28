import type { t } from '../common.ts';
import type { AnsiColor } from '@sys/color/t';
import type { CliFormatChapters } from '../m.Fmt.Chapters/t.ts';
import type { CliFormatCommitLib } from './t.commit.ts';
import type { CliFormatHelpLib } from './t.help.ts';

/** Type re-exports. */
export type * from '../m.Fmt.Chapters/t.ts';
export type * from './t.commit.ts';
export type * from './t.help.ts';

/**
 * CLI formatting helper types.
 */
export declare namespace CliFormat {
  /** Common formatting helpers when working with a CLI. */
  export type Lib = {
    /** Horizontal rule display formatting. */
    hr: Hr.Fn;

    /** Common spinner status text formatting. */
    spinnerText: Spinner.Text;

    /** Spinner spacing wrapper for text that is already fully formatted. */
    spinnerRaw: Spinner.Text;

    /** Help page formatting. */
    readonly Help: CliFormatHelpLib;

    /** Navigable help chapter formatting and tree helpers. */
    readonly Chapters: CliFormatChapters.Lib;

    /** Commit message suggestion formatting. */
    readonly Commit: CliFormatCommitLib;

    /** Path display formatting. */
    path: t.Path.Format.Lib['string'];

    /** Pretty path formatting helpers. */
    readonly Path: {
      str: (path: string) => string;
      tty: (path: string, options?: Path.TtyOptions) => string;
      fmt: (opts?: {}) => t.Path.Format.Formatter;
    };

    /** Service URL formatting and presentation ordering helpers. */
    readonly Url: {
      service(
        url: t.Service.Url,
        options?: { readonly highlightOrigin?: boolean },
      ): string;
      serviceList(urls: readonly t.Service.Url[]): readonly string[];
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

  export namespace Path {
    /** Terminal-adaptive path shortening options. */
    export type TtyOptions = {
      /** Standard stream used to detect terminal output. Defaults to `stdout`. */
      readonly stream?: t.StdioName;
      /** Terminal detection override for deterministic tests. */
      readonly terminal?: boolean;
      /** Terminal width override for deterministic tests/layouts. */
      readonly width?: number;
      /** Width reserved for surrounding table/label content. Defaults to 0. */
      readonly reserve?: number;
      /** Minimum path width before shortening. Defaults to 32. */
      readonly min?: number;
    };
  }

  export namespace Spinner {
    /** Spacing input accepted by spinner text helpers. */
    export type Spacing = boolean | number | [number, number];

    /** Spinner text formatter signature. */
    export type Text = {
      (text: string): string;
      (text: string, spacing: Spacing): string;
    };
  }

  export namespace Hr {
    /** Foreground color name accepted by the horizontal rule formatter. */
    export type Color = AnsiColor.Name;

    /** Visual rule stroke weight. */
    export type Weight = 'heavy' | 'light' | 'double' | 'dashed';

    /** Horizontal rule formatting options. */
    export type Options = {
      /** Explicit rule width. Omit to use the current screen width. */
      readonly width?: number;
      /** Optional rule foreground color. */
      readonly color?: Color;
      /** Optional rule stroke weight. Defaults to `heavy`. */
      readonly weight?: Weight;
    };

    /**
     * Horizontal rule formatter.
     *
     * Supported call forms:
     * - `hr()`        ← calculated window width, default color.
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
