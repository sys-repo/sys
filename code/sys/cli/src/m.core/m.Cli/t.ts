import type { t } from '../common.ts';

/**
 * Root CLI type namespace.
 */
export declare namespace Cli {
  /** Tools for command-line interfaces. */
  export type Lib = {
    /** Argument parsing helpers. */
    readonly Args: t.Args.Lib;

    /** Tools for working with string paths. */
    readonly Path: t.Path.Lib;

    /** Tools for working with CLI tables. */
    readonly Table: Table.Lib;

    /** Tools for working with a CLI spinner. */
    readonly Spinner: Spinner.Lib;

    /** Common formatting helpers. */
    readonly Fmt: Fmt.Lib;

    /** Predicate helpers for CLI runtime capabilities. */
    readonly Is: Is.Lib;

    /** Tools for working with the keyboard within a CLI. */
    readonly Keyboard: Keyboard.Lib;

    /** Index of input prompts. */
    readonly Input: Input.Lib;

    /** Direct access to low-level prompt primitives. */
    readonly Prompt: Prompt.Lib; // ← available where direct access to prompt primitives is needed.

    /** Tools for working with a terminal screen. */
    readonly Screen: Screen.Lib;

    /** Parse command-line arguments into an object (argv). */
    args: t.Args.Lib['parse'];

    /** Create a new Table generator instance. */
    table: Table.Lib['create'];

    /** Create and start a new spinner instance. */
    spinner: Spinner.Lib['start'];

    /** Wait for the specified milliseconds. */
    wait: t.Time.Lib['wait'];

    /** Listen to keypress events. */
    keypress: Keyboard.Lib['keypress'];

    /** Strip ANSI escape codes from a string. */
    stripAnsi(input: string): string;

    /** Copy arbitrary text to the system clipboard from a Deno CLI context. */
    copyToClipboard(text: string): Promise<t.CliCopyResult>;

    /**
     * Keep a long-running CLI process alive until Ctrl-C.
     *
     * Installs a SIGINT handler, forwards it to a lifecycle, waits for
     * disposal, then exits the process with the given exit code.
     */
    keepAlive: (options?: t.CliKeepAliveOptions) => Promise<never>;
  };

  /**
   * Human input helper types.
   */
  export namespace Input {
    /** Human input helper library contract. */
    export type Lib = t.CliInputLib;
  }

  /**
   * Predicate helper types.
   */
  export namespace Is {
    /** CLI runtime predicate helper library contract. */
    export type Lib = t.CliIsLib;
  }

  /**
   * Keyboard helper types.
   */
  export namespace Keyboard {
    /** CLI keyboard helper library contract. */
    export type Lib = t.CliKeyboardLib;
    /** Minimal keypress shape used by CLI keyboard predicates. */
    export type Event = t.CliKeyboardEvent;
    /** Options for binding terminal keyboard controls. */
    export type BindOptions = t.CliKeyboardBindOptions;
    /** Handle returned from a bound keyboard listener. */
    export type BindHandle = t.CliKeyboardBindHandle;
  }

  /**
   * Prompt helper types.
   */
  export namespace Prompt {
    /** Low-level prompt primitive library contract. */
    export type Lib = t.CliPromptLib;
  }

  /**
   * Terminal screen helper types.
   */
  export namespace Screen {
    /** Terminal screen helper library contract. */
    export type Lib = t.CliScreenLib;
    /** Current terminal dimensions in character cells. */
    export type Size = t.CliScreenSize;
    /** Terminal screen events. */
    export type Events = t.CliScreenEvents;
    /** Terminal screen event union. */
    export type Event = t.CliScreenEvent;
    /** Terminal resize event. */
    export type SizeChanged = t.CliScreenSizeChanged;
  }

  /**
   * CLI spinner types.
   */
  export namespace Spinner {
    /** CLI spinner helper library contract. */
    export type Lib = t.CliSpinner.Lib;
    /** CLI spinner creation options. */
    export type Options = t.CliSpinner.Options;
    /** Stateful CLI spinner instance. */
    export type Instance = t.CliSpinner.Instance;
  }

  /**
   * CLI table types.
   */
  export namespace Table {
    /** CLI table helper library contract. */
    export type Lib = t.CliTableLib;
    /** CLI table instance. */
    export type Instance = t.CliTable;
  }

  /**
   * CLI formatting helper types.
   */
  export namespace Fmt {
    /** CLI formatting helper library contract. */
    export type Lib = t.CliFormat.Lib;

    /**
     * Help page formatter types.
     */
    export namespace Help {
      /** Help page formatting helper library contract. */
      export type Lib = t.CliFormatHelpLib;
      /** Declarative input contract for the shared help page formatter. */
      export type Input = t.CliFormatHelpInput;
      /** Help input form using the generalized section model. */
      export type InputSections = t.CliFormatHelpInputSections;
      /** Help input form using the standard shorthand fields. */
      export type InputShorthand = t.CliFormatHelpInputShorthand;
      /** Declarative section model for help page rendering. */
      export type Section = t.CliFormatHelpSection;
      /** Two-column help row rendered as left/right content. */
      export type Pair = t.CliFormatHelpPair;
      /** Standard option row shorthand for help pages. */
      export type Option = t.CliFormatHelpOption;
      /** Color treatment for help section content. */
      export type Tone = t.CliFormatHelpTone;
      /** Terminal help layout options. */
      export type LayoutOptions = t.CliFormatHelpLayoutOptions;
    }

    /**
     * Navigable help chapter formatter types.
     */
    export namespace Chapters {
      /** Navigable chapter formatting and tree utility library. */
      export type Lib = t.CliFormatChapters.Lib;
      /** Terminal chapter guide rendering input. */
      export type FormatInput = t.CliFormatChapters.FormatInput;
      /** Terminal chapter layout options. */
      export type LayoutOptions = t.CliFormatChapters.LayoutOptions;
      /** Complete terminal chapter help page rendering input. */
      export type PageInput = t.CliFormatChapters.PageInput;
      /** Markdown chapter rendering input. */
      export type MarkdownInput = t.CliFormatChapters.MarkdownInput;
      /** YAML frontmatter fields for Markdown chapter output. */
      export type Frontmatter = t.CliFormatChapters.Frontmatter;
      /** Reusable chapter-book loader for authored chapter resources. */
      export type Book<TFile extends string = string> = t.CliFormatChapters.Book<TFile>;
      /** Embedded help/chapter resource bundle reader. */
      export type Resources<TFile extends string = string> = t.CliFormatChapters.Resources<TFile>;
      /** Navigable help chapter rendered by a CLI help surface. */
      export type Chapter = t.CliFormatChapters.Chapter;
      /** Authored help section with display label and ordered items. */
      export type Section = t.CliFormatChapters.Section;

      /**
       * Chapter-book loader types.
       */
      export namespace Book {
        /** Chapter-book loader factory surface. */
        export type Lib = t.CliFormatChapters.Book.Lib;
        /** Input used to create a chapter-book loader. */
        export type Input<TFile extends string = string> = t.CliFormatChapters.Book.Input<TFile>;
        /** Resource record reader. */
        export type Reader<TFile extends string = string> = t.CliFormatChapters.Book.Reader<TFile>;
      }

      /**
       * Embedded resource reader types.
       */
      export namespace Resources {
        /** Embedded resource reader factory surface. */
        export type Lib = t.CliFormatChapters.Resources.Lib;
        /** Input used to create an embedded resource reader. */
        export type Input<TFile extends string = string> = t.CliFormatChapters.Resources.Input<
          TFile
        >;
        /** Parse a text resource into a caller-owned record shape. */
        export type Parser<TFile extends string = string> = t.CliFormatChapters.Resources.Parser<
          TFile
        >;
      }

      /**
       * Navigable help chapter types.
       */
      export namespace Chapter {
        /** Child chapter shown as a drill-down command link. */
        export type Link = t.CliFormatChapters.Chapter.Link;
        /** Authored chapter resource registered for recursive lookup. */
        export type Resource<TFile extends string = string> = t.CliFormatChapters.Chapter.Resource<
          TFile
        >;
      }
    }

    /**
     * Text fitting and wrapping helper types.
     */
    export namespace Text {
      /** Text fitting and wrapping helper library contract. */
      export type Lib = t.CliFormatTextLib;
    }

    /**
     * Path display formatter types.
     */
    export namespace Path {
      /** Path presentation options. */
      export type FormatOptions = t.CliFormat.Path.FormatOptions;
      /** Terminal-adaptive path shortening options. */
      export type TtyOptions = t.CliFormat.Path.TtyOptions;
    }

    /**
     * Service URL formatter types.
     */
    export namespace Url {
      /** URL display parts. */
      export type Parts = t.CliFormat.Url.Parts;
      /** Service URL display parts with origin highlighting state. */
      export type ServicePart = t.CliFormat.Url.ServicePart;
    }

    /**
     * Spinner text formatter types.
     */
    export namespace Spinner {
      /** Spacing input accepted by spinner text helpers. */
      export type Spacing = t.CliFormat.Spinner.Spacing;
      /** Spinner text formatter signature. */
      export type Text = t.CliFormat.Spinner.Text;
    }

    /**
     * Horizontal rule formatter types.
     */
    export namespace Hr {
      /** Foreground color name accepted by the horizontal rule formatter. */
      export type Color = t.CliFormat.Hr.Color;
      /** Visual rule stroke weight. */
      export type Weight = t.CliFormat.Hr.Weight;
      /** Horizontal rule formatting options. */
      export type Options = t.CliFormat.Hr.Options;
      /** Horizontal rule formatter. */
      export type Fn = t.CliFormat.Hr.Fn;
    }
  }
}
