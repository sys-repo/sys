import type { t } from '../common.ts';

/**
 * Contracts for building and rendering terminal help pages.
 *
 * Inputs use either explicit ordered sections or the common shorthand fields.
 */
export declare namespace CliFormatHelp {
  /**
   * Builds help text and optionally writes it to stdout.
   */
  export type Lib = {
    /** Build a formatted help page string from declarative input. */
    build(input: Input): string;
    /** Print the built help page to stdout via `console.info`. */
    render(input: Input): void;
  };

  /**
   * Declarative input contract for the shared help page formatter.
   *
   * Exactly one input mode is valid:
   * - generalized `sections`
   * - shorthand `usage` / `options` / `examples`
   */
  export type Input = InputSections | InputShorthand;

  /** Shared top matter for help page inputs. */
  export type InputBase = {
    /** Primary help page title. */
    readonly tool: string;
    /** Optional one-line summary rendered below the title. */
    readonly summary?: string;
    /** Optional subdued note rendered below the summary. */
    readonly note?: string;
    /** Optional terminal layout constraints. */
    readonly layout?: LayoutOptions;
  };

  /**
   * Help input form using the generalized section model.
   *
   * This is the canonical extensible input branch. Shorthand section fields are
   * intentionally disallowed in this shape.
   */
  export type InputSections = InputBase & {
    /** Explicit ordered help sections to render. */
    readonly sections: readonly Section[];
    readonly usage?: never;
    readonly options?: never;
    readonly examples?: never;
  };

  /**
   * Help input form using the standard shorthand fields.
   *
   * This is the ergonomic convenience branch for common CLI help pages. It is
   * mutually exclusive with the generalized `sections` branch.
   */
  export type InputShorthand = InputBase & {
    readonly sections?: never;
    /** Usage lines rendered as a labeled section. */
    readonly usage?: readonly string[];
    /** Option rows rendered as a labeled two-column section. */
    readonly options?: readonly Option[];
    /** Example lines rendered as a muted labeled section. */
    readonly examples?: readonly string[];
  };

  /**
   * Ordered section model used by the help renderer.
   *
   * Shorthand fields normalize into this model.
   */
  export type Section =
    | {
      /** Render a single-column labeled section. */
      readonly kind: 'lines';
      /** Gray section label shown at the left margin. */
      readonly label: string;
      /** Ordered section content. */
      readonly items: readonly string[];
      /** Optional color treatment for the section content. */
      readonly tone?: Tone;
    }
    | {
      /** Render a two-column labeled section. */
      readonly kind: 'pairs';
      /** Gray section label shown at the left margin. */
      readonly label: string;
      /** Ordered left/right row content. */
      readonly items: readonly Pair[];
      /** Optional color treatment for left-column content. */
      readonly leftTone?: Tone;
      /** Optional color treatment for right-column content. */
      readonly rightTone?: Tone;
    };

  /** Two-column help row rendered as left/right content. */
  export type Pair = readonly [left: string, right: string];

  /** Standard option row shorthand for help pages. */
  export type Option = Pair;

  /**
   * Color treatment for help section content.
   *
   * - `'default'` renders content in the normal bright/white foreground.
   * - `'muted'` renders content in the subdued gray foreground.
   */
  export type Tone = 'default' | 'muted';

  /** Terminal help layout options. */
  export type LayoutOptions = {
    /** Explicit physical page width. */
    readonly width?: number;
    /** Maximum readable page width. */
    readonly maxWidth?: number;
    /** Minimum body width before falling back to stacked rows. */
    readonly minBodyWidth?: number;
    /** Deterministic width used when terminal width is unavailable. */
    readonly fallbackWidth?: number;
    /** Standard stream used to detect terminal output. Defaults to `stdout`. */
    readonly stream?: t.StdioName;
    /** Terminal detection override for deterministic tests. */
    readonly terminal?: boolean;
  };
}
