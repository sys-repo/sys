import type { t } from '../common.ts';
import type { AnsiColor } from '@sys/color/t';
import type { CliFormatChapters } from '../m.Fmt.Chapters/t.ts';
import type { CliFormatCommit } from './t.commit.ts';
import type { CliFormatHeader } from './t.header.ts';
import type { CliFormatHelp } from './t.help.ts';
import type { CliFormatText } from '../m.Fmt.Text/t.ts';

/** Type re-exports. */
export type * from '../m.Fmt.Chapters/t.ts';
export type * from './t.commit.ts';
export type * from './t.header.ts';
export type * from './t.help.ts';
export type * from '../m.Fmt.Text/t.ts';

/**
 * Contracts for terminal presentation shared across CLI surfaces.
 *
 * Focused formatter modules remain canonical owners of their own contracts.
 */
export declare namespace CliFormat {
  /**
   * Aggregates the base CLI formatting libraries and functions.
   */
  export type Lib = {
    /** Horizontal rule display formatting. */
    hr: Hr.Fn;

    /** OSC 8 terminal hyperlink formatting. */
    hyperlink: Hyperlink.Fn;

    /** Application identity header formatting. */
    readonly Header: CliFormatHeader.Lib;

    /** Common spinner status text formatting. */
    spinnerText: Spinner.Text;

    /** Spinner spacing wrapper for text that is already fully formatted. */
    spinnerRaw: Spinner.Text;

    /** Help page formatting. */
    readonly Help: CliFormatHelp.Lib;

    /** Format a formatter-inserted omission marker as dim gray structural context. Defaults to `…`. */
    readonly omission: (text?: string) => string;

    /** Terminal text measurement, fitting, wrapping, and clipping operations. */
    readonly Text: CliFormatText.Lib;

    /** Navigable help chapter formatting and tree helpers. */
    readonly Chapters: CliFormatChapters.Lib;

    /** Commit message suggestion formatting. */
    readonly Commit: CliFormatCommit.Lib;

    /** Path display formatting. */
    path: t.Path.Format.Lib['string'];

    /** Pretty path formatting helpers. */
    readonly Path: Path.Lib;

    /** Service URL formatting and presentation ordering helpers. */
    readonly ServiceUrl: ServiceUrl.Lib;

    /** Glyphs and helpers for rendering a tree hierarchy. */
    readonly Tree: Tree.Lib;
  };

  /**
   * Contracts for OSC 8 terminal hyperlink formatting.
   */
  export namespace Hyperlink {
    /**
     * Wrap terminal presentation text in an OSC 8 hyperlink.
     *
     * The label is emitted verbatim so existing ANSI styling survives. The URL supplies the
     * serialized absolute href. Callers own label trust, URL scheme policy, and terminal/fallback
     * selection.
     */
    export type Fn = (label: string, href: URL) => string;
  }

  /**
   * Contracts for path display and terminal-aware shortening.
   */
  export namespace Path {
    /**
     * Formats paths for general and terminal-constrained presentation.
     */
    export type Lib = {
      /** Format a path for display. */
      str: (path: string, options?: FormatOptions) => string;
      /** Format a path with optional terminal-aware shortening. */
      tty: (path: string, options?: TtyOptions) => string;
      /** Create a path-part formatter for the underlying path library. */
      fmt: (opts?: FormatOptions) => t.Path.Format.Formatter;
    };

    /** Path presentation options. */
    export type FormatOptions = {
      /** Highlight the basename in white. Defaults to true. */
      readonly highlightBasename?: boolean;
      /** Display style for formatter-added relative prefixes. Defaults to `prefixed`. */
      readonly relative?: 'prefixed' | 'bare';
      /** Color treatment for path fragments. Inserted omission markers are always dim gray. */
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

  /**
   * Service URL presentation contracts.
   */
  export namespace ServiceUrl {
    /** Service URL presentation library. */
    export type Lib = {
      /** Prepare service URLs as ordered display parts. */
      readonly parts: Parts.Method;
      /** Format one service URL or prepared part. */
      readonly format: Format.Method;
      /** Format service URLs in caller-supplied order. */
      readonly formatList: FormatList.Method;
    };

    /** One service URL prepared for terminal presentation. */
    export type Part = {
      /** Whether the source parsed as a URL. */
      readonly ok: boolean;
      /** Original URL text. */
      readonly href: t.StringUrl;
      /** Display origin. */
      readonly origin: string;
      /** Path, query, and fragment suffix. */
      readonly suffix: string;
      /** Complete display text. */
      readonly display: string;
      /** Explicit port, when present. */
      readonly port?: string;
      /** Whether presentation should emphasize the origin. */
      readonly highlightOrigin: boolean;
    };

    /**
     * Ordered service URL preparation contracts.
     */
    export namespace Parts {
      /** Prepare service URLs in caller-supplied order. */
      export type Method = (urls: Iterable<t.Service.Url>, options?: Options) => readonly Part[];

      /** Service URL display preparation options. */
      export type Options = {
        /** Display `127.0.0.1` as `localhost` or preserve its numeric hostname. */
        ipv4Loopback?: 'localhost' | 'exact';
      };
    }

    /**
     * Single service URL formatting contracts.
     */
    export namespace Format {
      /** Format one service URL or prepared part. */
      export type Method = {
        (url: t.Service.Url, options?: Options): string;
        (part: Part): string;
      };

      /** Single service URL formatting options. */
      export type Options = Parts.Options & {
        /** Origin presentation treatment. */
        origin?: 'highlight' | 'muted';
      };
    }

    /**
     * Service URL list formatting contracts.
     */
    export namespace FormatList {
      /** Format service URLs in caller-supplied order. */
      export type Method = (
        urls: Iterable<t.Service.Url>,
        options?: Parts.Options,
      ) => readonly string[];
    }
  }

  /**
   * Contracts for terminal tree glyphs and branch rendering.
   */
  export namespace Tree {
    /**
     * Supplies canonical tree glyphs and renders branch prefixes.
     */
    export type Lib = {
      /** Vertical continuation glyph. */
      readonly vert: '│';
      /** Non-final branch glyph. */
      readonly mid: '├';
      /** Final branch glyph. */
      readonly last: '└';
      /** Horizontal branch stroke. */
      readonly bar: '─';
      /** Render a branch prefix from final-row state or an indexed collection position. */
      branch(isLastOrTuple: boolean | [t.Index, t.Ary<unknown>], extend?: number): string;
    };
  }

  /**
   * Contracts for spinner label formatting and spacing.
   */
  export namespace Spinner {
    /** Spacing input accepted by spinner text helpers. */
    export type Spacing = boolean | number | [number, number];

    /** Spinner text formatter signature. */
    export type Text = {
      (text: string): string;
      (text: string, spacing: Spacing): string;
    };
  }

  /**
   * Contracts for horizontal rules and progress-rule presentation.
   */
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
     * Contracts for splitting a rule into completed and remaining segments.
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
