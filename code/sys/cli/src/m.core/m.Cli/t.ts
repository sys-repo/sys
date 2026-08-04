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
    copyToClipboard(text: string): Promise<CopyToClipboard.Result>;

    /**
     * Keep a long-running CLI process alive until Ctrl-C.
     *
     * Installs a SIGINT handler, forwards it to a lifecycle, waits for
     * disposal, then exits the process with the given exit code.
     */
    keepAlive: (options?: KeepAlive.Options) => Promise<never>;
  };

  /**
   * Long-running CLI process types.
   */
  export namespace KeepAlive {
    /** Options for a long-running CLI process that exits on Ctrl-C. */
    export type Options = {
      /**
       * Optional callback invoked once the lifecycle is created and before
       * the function starts waiting. Use this to start servers, subscribe to
       * streams, etc.
       */
      readonly onStart?: (life: t.Lifecycle) => void | Promise<void>;

      /**
       * Process exit code used when Ctrl-C is received.
       * Defaults to 0 (success).
       */
      readonly exitCode?: number;

      /** Lifecycle kill switch. */
      life?: t.Lifecycle;
    };
  }

  /**
   * Clipboard operation types.
   */
  export namespace CopyToClipboard {
    /** Response from `Cli.copyToClipboard`. */
    export type Result =
      | {
        /** Clipboard write completed successfully. */
        ok: true;
      }
      | {
        /** Clipboard write failed. */
        ok: false;
        /** Underlying clipboard error. */
        error: Error;
        /** Clipboard commands attempted before failing. */
        tried: string[];
      };
  }

  /**
   * Human input helper types.
   */
  export namespace Input {
    /** Human input helper library contract. */
    export type Lib = t.CliInput.Lib;

    /**
     * Menu interaction result types.
     */
    export namespace Menu {
      /** Discrete menu interaction outcome. */
      export type ResultKind = t.CliInput.Menu.ResultKind;
      /** Result returned from a menu handler. */
      export type Result = t.CliInput.Menu.Result;
    }
  }

  /**
   * Predicate helper types.
   */
  export namespace Is {
    /** CLI runtime predicate helper library contract. */
    export type Lib = t.CliIs.Lib;
  }

  /**
   * Keyboard helper types.
   */
  export namespace Keyboard {
    /** CLI keyboard helper library contract. */
    export type Lib = t.CliKeyboard.Lib;
    /** Minimal keypress shape used by CLI keyboard predicates. */
    export type Event = t.CliKeyboard.Event;

    /**
     * Keyboard binding types.
     */
    export namespace Bind {
      /** Options for binding terminal keyboard controls. */
      export type Options = t.CliKeyboard.Bind.Options;
      /** Handle returned from a bound keyboard listener. */
      export type Handle = t.CliKeyboard.Bind.Handle;
    }
  }

  /**
   * Prompt helper types.
   */
  export namespace Prompt {
    /** Low-level prompt primitive library contract. */
    export type Lib = t.CliPrompt.Lib;
  }

  /**
   * Terminal screen helper types.
   */
  export namespace Screen {
    /** Terminal screen helper library contract. */
    export type Lib = t.CliScreen.Lib;
    /** Current terminal dimensions in character cells. */
    export type Size = t.CliScreen.Size;
    /** Terminal screen events. */
    export type Events = t.CliScreen.Events;
    /** Terminal screen event union. */
    export type Event = t.CliScreen.Event;
    /** Terminal resize event. */
    export type SizeChanged = t.CliScreen.SizeChanged;
  }

  /**
   * CLI spinner types.
   */
  export namespace Spinner {
    /** CLI spinner helper library contract. */
    export type Lib = t.CliSpinner.Lib;
    /** Semantic terminal-output target used by the spinner owner. */
    export type OutputTarget = t.CliSpinner.OutputTarget;
    /** Spinner creation contracts. */
    export namespace Create {
      /** Options for creating a spinner without starting it. */
      export type Options = t.CliSpinner.Create.Options;
    }
    /** CLI spinner creation and start options. */
    export type Options = t.CliSpinner.Options;
    /** Stateful CLI spinner instance. */
    export type Instance = t.CliSpinner.Instance;
  }

  /**
   * CLI table types.
   */
  export namespace Table {
    /** CLI table helper library contract. */
    export type Lib = t.CliTable.Lib;
    /** CLI table instance. */
    export type Instance = t.CliTable.Instance;
  }

  /**
   * Consumer-facing projections of the canonical formatter contracts.
   *
   * Each leaf aliases its owning formatter module; no shapes are redefined here.
   */
  export namespace Fmt {
    /** CLI formatting helper library contract. */
    export type Lib = t.CliFormat.Lib;

    /**
     * Application-header contract projections.
     */
    export namespace Header {
      /** Application-header formatting helper library contract. */
      export type Lib = t.CliFormatHeader.Lib;
      /** Application-header formatting requirements. */
      export type Options = t.CliFormatHeader.Options;
    }

    /**
     * Help-page contract projections.
     */
    export namespace Help {
      /** Help page formatting helper library contract. */
      export type Lib = t.CliFormatHelp.Lib;
      /** Declarative input contract for the shared help page formatter. */
      export type Input = t.CliFormatHelp.Input;
      /** Shared top matter for help page inputs. */
      export type InputBase = t.CliFormatHelp.InputBase;
      /** Help input form using the generalized section model. */
      export type InputSections = t.CliFormatHelp.InputSections;
      /** Help input form using the standard shorthand fields. */
      export type InputShorthand = t.CliFormatHelp.InputShorthand;
      /** Declarative section model for help page rendering. */
      export type Section = t.CliFormatHelp.Section;
      /** Two-column help row rendered as left/right content. */
      export type Pair = t.CliFormatHelp.Pair;
      /** Standard option row shorthand for help pages. */
      export type Option = t.CliFormatHelp.Option;
      /** Color treatment for help section content. */
      export type Tone = t.CliFormatHelp.Tone;
      /** Terminal help layout options. */
      export type LayoutOptions = t.CliFormatHelp.LayoutOptions;
    }

    /**
     * Commit suggestion contract projections.
     */
    export namespace Commit {
      /** Commit suggestion formatter library contract. */
      export type Lib = t.CliFormatCommit.Lib;
      /** Commit suggestion formatting options. */
      export type Options = t.CliFormatCommit.Options;
      /** Commit suggestion title options. */
      export type Title = t.CliFormatCommit.Title;
      /** Commit suggestion text styling options. */
      export type Text = t.CliFormatCommit.Text;
    }

    /**
     * Navigable help chapter contract projections.
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
       * Chapter-book loader contract projections.
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
       * Embedded resource reader contract projections.
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
       * Chapter link and resource node contract projections.
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
     * Exact projections of the formatter-owned terminal text contracts.
     */
    export namespace Text {
      /** Exact projection of the terminal text operation library. */
      export type Lib = t.CliFormatText.Lib;

      /**
       * Exact projections of formatter-owned terminal-cell width contracts.
       */
      export namespace Width {
        /** Exact projection of the terminal-cell width operation library. */
        export type Lib = t.CliFormatText.Width.Lib;

        /**
         * Usable width fitting policy projections.
         */
        export namespace Fit {
          /** Width fitting options for terminal-aware text layout. */
          export type Options = t.CliFormatText.Width.Fit.Options;
        }
      }

      /**
       * Exact projections of formatter-owned prose wrapping contracts.
       */
      export namespace Wrap {
        /** Exact projection of the prose wrapping operation library. */
        export type Lib = t.CliFormatText.Wrap.Lib;
        /** Prose wrapping options. */
        export type Options = t.CliFormatText.Wrap.Options;
        /** Whole-line preservation policy for wrapping. */
        export type Preserve = t.CliFormatText.Wrap.Preserve;
        /** Custom whole-line preservation predicate. */
        export type PreserveFn = t.CliFormatText.Wrap.PreserveFn;
      }

      /**
       * Exact projections of formatter-owned middle-clipping marker and rendering contracts.
       */
      export namespace Ellipsize {
        /** Options for terminal-cell-aware middle ellipsis. */
        export type Options = t.CliFormatText.Ellipsize.Options;
        /** Plain clipped fragments supplied to a styling-only renderer. */
        export type Parts = t.CliFormatText.Ellipsize.Parts;
        /** Styling-only renderer for a clipped plain-text result. */
        export type Render = t.CliFormatText.Ellipsize.Render;
      }
    }

    /**
     * OSC 8 terminal hyperlink contract projections.
     */
    export namespace Hyperlink {
      /** OSC 8 terminal hyperlink formatter. */
      export type Fn = t.CliFormat.Hyperlink.Fn;
    }

    /**
     * Path display contract projections.
     */
    export namespace Path {
      /** Pretty path formatting helper library contract. */
      export type Lib = t.CliFormat.Path.Lib;
      /** Path presentation options. */
      export type FormatOptions = t.CliFormat.Path.FormatOptions;
      /** Terminal-adaptive path shortening options. */
      export type TtyOptions = t.CliFormat.Path.TtyOptions;
    }

    /**
     * Service URL presentation contract projections.
     */
    export namespace Url {
      /** Service URL formatting helper library contract. */
      export type Lib = t.CliFormat.Url.Lib;
      /** URL display parts. */
      export type Parts = t.CliFormat.Url.Parts;
      /** Service URL display parts with origin highlighting state. */
      export type ServicePart = t.CliFormat.Url.ServicePart;
    }

    /**
     * Terminal tree contract projections.
     */
    export namespace Tree {
      /** Glyph and hierarchy rendering helper library contract. */
      export type Lib = t.CliFormat.Tree.Lib;
    }

    /**
     * Spinner label contract projections.
     */
    export namespace Spinner {
      /** Spacing input accepted by spinner text helpers. */
      export type Spacing = t.CliFormat.Spinner.Spacing;
      /** Spinner text formatter signature. */
      export type Text = t.CliFormat.Spinner.Text;
    }

    /**
     * Horizontal rule contract projections.
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
