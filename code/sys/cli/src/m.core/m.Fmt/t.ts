import type { t } from '../common.ts';
import type { AnsiColor } from '@sys/color/t';
import type { CliFormatChapters } from '../m.Fmt.Chapters/t.ts';
import type { CliFormatCommit } from './t.commit.ts';
import type { CliFormatHeader } from './t.header.ts';
import type { CliFormatHelp } from './t.help.ts';
import type { CliFormatKeyboard } from './t.keyboard.ts';
import type { CliFormatText } from '../m.Fmt.Text/t.ts';

/** Type re-exports. */
export type * from '../m.Fmt.Chapters/t.ts';
export type * from './t.commit.ts';
export type * from './t.header.ts';
export type * from './t.help.ts';
export type * from './t.keyboard.ts';
export type * from '../m.Fmt.Text/t.ts';

/**
 * Text and layout formatting for command-line output.
 */
export declare namespace CliFormat {
  /** Terminal text and layout formatters. */
  export type Lib = {
    /**
     * Whether monitored formatter dependencies still match their state at import.
     * The initial state is trusted, not verified.
     */
    readonly isReady: () => boolean;

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

    /** Keyboard command and adaptive-row formatting. */
    readonly Keyboard: CliFormatKeyboard.Lib;

    /** Format an omission marker in dim gray. Defaults to `…`. */
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

    /** Format one service or a list with aligned columns. */
    readonly Service: Service.Lib;

    /** Format service URLs in caller-supplied order. */
    readonly ServiceUrl: ServiceUrl.Lib;

    /** Glyphs and helpers for rendering a tree hierarchy. */
    readonly Tree: Tree.Lib;
  };

  /**
   * OSC 8 terminal hyperlinks.
   */
  export namespace Hyperlink {
    /**
     * Wrap terminal presentation text in an OSC 8 hyperlink.
     *
     * Preserve ANSI styles in the label and use the URL's absolute href.
     * The caller must trust the label and choose which URL schemes and terminals receive links.
     */
    export type Fn = (label: string, href: URL, options?: Options) => string;

    /** Optional hyperlink label decoration. */
    export type Options = {
      /** Add an underline for opaque references; defaults to false. */
      underline?: boolean;
    };
  }

  /**
   * Path display and shortening to fit the terminal.
   */
  export namespace Path {
    /** Format paths, with optional shortening to fit the terminal. */
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
   * Format service status as text without printing or managing the service.
   */
  export namespace Service {
    /** Service text formatting; no added leading or trailing newlines. */
    export type Lib = {
      readonly format: (input: Input, options?: Options) => string;
      /** Align columns across services, with dashed rules between them. */
      readonly formatList: (inputs: readonly Input[], options?: Options) => string;
    };

    /** Service name, status, and display settings; `status.name` is ignored. */
    export type Input = {
      name: string;
      module?: string;
      /** Text styled separately after the name, e.g. `--mode=dev`. */
      annotation?: string;
      status?: t.Service.Status;
      presentation?: Presentation;
      keyboard?: Keyboard;
      urlDisplay?: ServiceUrl.Parts.Options;
    };

    /** Terminal width and automatic URL links; links in custom detail values are unchanged. */
    export type Options = {
      /**
       * Override terminal width in cells. Rounded down; non-finite values or results outside
       * 1..65,535 render nothing.
       */
      width?: number;
      /** Override stdout terminal detection. Without width, non-terminal output has no width limit. */
      terminal?: boolean;
      /**
       * Link HTTP(S)/WS(S) URLs to their original addresses. Defaults to false.
       * URLs containing credentials or control characters display as `invalid URL`,
       * with or without links.
       */
      urlHyperlinks?: boolean;
    };

    /** Custom detail formatting; the callback is captured once per service render. */
    export type Presentation = { readonly formatDetail?: FormatDetail };

    /**
     * Called synchronously without `this`, once per detail after columns are measured.
     * Not called when rendering is skipped.
     *
     * Return `undefined` to use `detail.value`; `''` leaves the value blank. If any LF-delimited
     * line exceeds `maxWidth`, the whole result falls back to `detail.value`.
     * Custom text is not clipped, sanitized, or repaired.
     * Close ANSI styles and OSC links on each line.
     *
     * Throws propagate unchanged unless formatter integrity checks fail. Other return types
     * throw TypeError. The callback is neither awaited nor retried and has no timeout.
     * Integrity and total size limits still apply when no width limit is set.
     */
    export type FormatDetail = (args: {
      readonly detail: t.Service.Detail;
      /** Available terminal cells; undefined means no width limit. */
      readonly maxWidth?: number;
    }) => string | undefined;

    /** Detail formatting on a local service handle, not in status or serialized data. */
    export type PresentationProvider = { readonly servicePresentation?: Presentation };

    /** Open and quit key hints; the caller binds the keys. */
    export type Keyboard = {
      readonly open?: string;
      readonly quit?: string;
    };
  }

  /**
   * Service URLs formatted for terminal output.
   */
  export namespace ServiceUrl {
    /** Format URLs, highlighting each origin's first appearance in a list. */
    export type Lib = {
      /** Choose how a hostname appears without parsing a full URL. */
      readonly displayHostname: DisplayHostname.Method;
      /** Prepare URL display parts in caller-supplied order. */
      readonly parts: Parts.Method;
      /** Format one service URL or prepared part. */
      readonly format: Format.Method;
      /** Format service URLs in caller-supplied order. */
      readonly formatList: FormatList.Method;
    };

    /** A URL split into display text and its original address. */
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
      /** Port shown in the origin, if any. */
      readonly port?: string;
      /** Whether to highlight the origin in the output. */
      readonly highlightOrigin: boolean;
    };

    /**
     * Hostname display, including IPv4 loopback spelling.
     */
    export namespace DisplayHostname {
      /** Choose how a hostname appears without parsing a full URL. */
      export type Method = (hostname: t.StringHostname, options?: Options) => t.StringHostname;

      /** Service hostname display options. */
      export type Options = {
        /** Display `127.0.0.1` as `localhost` by default or preserve its numeric hostname. */
        ipv4Loopback?: 'localhost' | 'exact';
      };
    }

    /**
     * URL display parts in caller-supplied order.
     */
    export namespace Parts {
      /** Prepare service URLs in caller-supplied order. */
      export type Method = (urls: Iterable<t.Service.Url>, options?: Options) => readonly Part[];

      /** Hostname spelling used in URL display text. */
      export type Options = DisplayHostname.Options;
    }

    /**
     * Formatting for one service URL.
     */
    export namespace Format {
      /** Format one service URL or prepared part. */
      export type Method = {
        (url: t.Service.Url, options?: Options): string;
        (part: Part): string;
      };

      /** Single service URL formatting options. */
      export type Options = Parts.Options & {
        /** Highlight or mute the displayed origin. */
        origin?: 'highlight' | 'muted';
      };
    }

    /**
     * Formatting for a list of service URLs.
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
   * Tree glyphs and branch prefixes for terminal output.
   */
  export namespace Tree {
    /** Tree glyphs and branch-prefix formatting. */
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
   * Spinner labels and spacing.
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
   * Horizontal rules and progress indicators.
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
     * Split a rule into completed and remaining segments.
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
