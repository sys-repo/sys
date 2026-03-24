/**
 * Color treatment for help section content.
 *
 * - `'default'` renders content in the normal bright/white foreground.
 * - `'muted'` renders content in the subdued gray foreground.
 */
export type CliFormatHelpTone = 'default' | 'muted';

/**
 * Two-column help row rendered as left/right content.
 *
 * This is the primitive pair shape for option rows and other label/value
 * section content.
 */
export type CliFormatHelpPair = readonly [left: string, right: string];

/**
 * Standard option row shorthand for help pages.
 *
 * Alias of {@link CliFormatHelpPair}.
 */
export type CliFormatHelpOption = CliFormatHelpPair;

/**
 * Declarative section model for help page rendering.
 *
 * This is the extensible, long-term help layout surface. Tool-specific
 * shorthands such as `usage`, `options`, and `examples` are convenience input
 * forms that normalize into this section model.
 */
export type CliFormatHelpSection =
  | {
      /** Render a single-column labeled section. */
      readonly kind: 'lines';
      /** Gray section label shown at the left margin. */
      readonly label: string;
      /** Ordered section content. */
      readonly items: readonly string[];
      /** Optional color treatment for the section content. */
      readonly tone?: CliFormatHelpTone;
    }
  | {
      /** Render a two-column labeled section. */
      readonly kind: 'pairs';
      /** Gray section label shown at the left margin. */
      readonly label: string;
      /** Ordered left/right row content. */
      readonly items: readonly CliFormatHelpPair[];
      /** Optional color treatment for left-column content. */
      readonly leftTone?: CliFormatHelpTone;
      /** Optional color treatment for right-column content. */
      readonly rightTone?: CliFormatHelpTone;
    };

/**
 * Shared top matter for help page inputs.
 */
export type CliFormatHelpInputBase = {
  /** Primary help page title. */
  readonly tool: string;
  /** Optional one-line summary rendered below the title. */
  readonly summary?: string;
  /** Optional subdued note rendered below the summary. */
  readonly note?: string;
};

/**
 * Help input form using the generalized section model.
 *
 * This is the canonical extensible input branch. Shorthand section fields are
 * intentionally disallowed in this shape.
 */
export type CliFormatHelpInputSections = CliFormatHelpInputBase & {
  /** Explicit ordered help sections to render. */
  readonly sections: readonly CliFormatHelpSection[];
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
export type CliFormatHelpInputShorthand = CliFormatHelpInputBase & {
  readonly sections?: never;
  /** Usage lines rendered as a labeled section. */
  readonly usage?: readonly string[];
  /** Option rows rendered as a labeled two-column section. */
  readonly options?: readonly CliFormatHelpOption[];
  /** Example lines rendered as a muted labeled section. */
  readonly examples?: readonly string[];
};

/**
 * Declarative input contract for the shared help page formatter.
 *
 * Exactly one input mode is valid:
 * - generalized `sections`
 * - shorthand `usage` / `options` / `examples`
 */
export type CliFormatHelpInput = CliFormatHelpInputSections | CliFormatHelpInputShorthand;

/**
 * Shared help page formatting surface.
 *
 * `build(...)` is the canonical pure formatter.
 * `render(...)` is the thin output convenience wrapper.
 */
export type CliFormatHelpLib = {
  /** Build a formatted help page string from declarative input. */
  build(input: CliFormatHelpInput): string;
  /** Print the built help page to stdout via `console.info`. */
  render(input: CliFormatHelpInput): void;
};
