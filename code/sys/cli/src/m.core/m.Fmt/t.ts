import type { t } from '../common.ts';
import type { AnsiColor } from '@sys/color/t';
import type { CliFormatChapters } from '../m.Fmt.Chapters/t.ts';
import type { CliFormatCommitLib } from './t.commit.ts';
import type { CliFormatHelpLib } from './t.help.ts';
import type { CliFormatTextLib } from '../m.Fmt.Text/t.ts';

/** Type re-exports. */
export type * from '../m.Fmt.Chapters/t.ts';
export type * from './t.commit.ts';
export type * from './t.help.ts';
export type * from '../m.Fmt.Text/t.ts';

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

    /** Text fitting and wrapping helpers. */
    readonly Text: CliFormatTextLib;

    /** Navigable help chapter formatting and tree helpers. */
    readonly Chapters: CliFormatChapters.Lib;

    /** Commit message suggestion formatting. */
    readonly Commit: CliFormatCommitLib;

    /** Path display formatting. */
    path: t.Path.Format.Lib['string'];

    /** Pretty path formatting helpers. */
    readonly Path: {
      str: (path: string, options?: Path.FormatOptions) => string;
      tty: (path: string, options?: Path.TtyOptions) => string;
      fmt: (opts?: Path.FormatOptions) => t.Path.Format.Formatter;
    };

    /** Service URL formatting and presentation ordering helpers. */
    readonly Url: {
      parts(url: t.Service.Url): Url.Parts;
      serviceParts(urls: readonly t.Service.Url[]): readonly Url.ServicePart[];
      service(
        url: t.Service.Url | Url.Parts,
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
    /** Path presentation options. */
    export type FormatOptions = {
      /** Highlight the basename in white. Defaults to true. */
      readonly highlightBasename?: boolean;
      /** Display style for formatter-added relative prefixes. Defaults to `prefixed`. */
      readonly relative?: 'prefixed' | 'bare';
      /** Color treatment for path fragments and inserted ellipses. Defaults to `default`. */
      readonly tone?: 'default' | 'muted';
    };

    /** Terminal-adaptive path shortening options. */
    export type TtyOptions = FormatOptions & {
      /** Standard stream used to detect terminal output. Defaults to `stdout`. */
      readonly stream?: t.StdioName;
      /** Terminal detection override for deterministic tests. */
      readonly terminal?: boolean;
      /** Shortening policy. Defaults to `terminal`; use `width` for explicit cell budgets. */
      readonly fit?: 'terminal' | 'width';
      /** Available display width. Defaults to the current terminal width. */
      readonly width?: number;
      /** Width subtracted from the display width for surrounding table/label content. Defaults to 0. */
      readonly reserve?: number;
      /** Minimum path width before shortening. Defaults to 32. */
      readonly min?: number;
    };
  }

  export namespace Url {
    export type Parts = {
      readonly ok: boolean;
      readonly href: string;
      readonly origin: string;
      readonly suffix: string;
      readonly display: string;
      readonly port?: string;
    };

    export type ServicePart = Parts & {
      readonly highlightOrigin: boolean;
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
      /** Primary rule color: whole rule in line mode, indicator segment in progress mode. */
      readonly color?: Color;
      /** Optional rule stroke weight. Defaults to `heavy`. */
      readonly weight?: Weight;
      /** Optional progress mode. */
      readonly progress?: Progress.Input;
    };

    /**
     * Progress-mode options for horizontal rules.
     */
    export namespace Progress {
      /** Progress shorthand or expanded options. */
      export type Input = t.Percent | Options;

      /** Progress-mode display options. */
      export type Options = {
        /** Fractional completion from 0..1. */
        readonly percent: t.Percent;
        /** Progress-bar part colors. */
        readonly color?: Colors;
      };

      /** Progress-bar part colors. */
      export type Colors = {
        /** Filled/completed value segment. Defaults to root `color`, then green. */
        readonly indicator?: Color;
        /** Background groove/remainder segment. Defaults to gray. */
        readonly track?: Color;
      };
    }

    /**
     * Horizontal rule formatter.
     *
     * Supported call forms:
     * - `hr()`        ← calculated window width, default color.
     * - `hr(width)`
     * - `hr(color)`
     * - `hr(width, color)`
     * - `hr(options)`
     * - `hr({ progress })`
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
