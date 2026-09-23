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
     * Lifecycle-owned single-selection prompt projections.
     */
    export namespace Select {
      /** Options supported by a lifecycle-owned single-selection prompt. */
      export type StartOptions<TValue> = t.CliInput.Select.StartOptions<TValue>;
      /** Terminal settlement of a lifecycle-owned single-selection prompt. */
      export type Outcome<TValue> = t.CliInput.Select.Outcome<TValue>;
      /** Running lifecycle-owned single-selection prompt authority. */
      export type Started<TValue> = t.CliInput.Select.Started<TValue>;
    }

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
    /**
     * Keyboard predicate type projections.
     */
    export namespace Is {
      /** Keyboard predicate library contract. */
      export type Lib = t.CliKeyboard.Is.Lib;
      /** Minimal keypress shape required by the canonical quit predicate. */
      export type QuitInput = t.CliKeyboard.Is.QuitInput;
      /** Partial keypress input accepted by the canonical back predicate. */
      export type BackInput = t.CliKeyboard.Is.BackInput;
      /** Partial keypress input accepted by the canonical redraw predicate. */
      export type RedrawInput = t.CliKeyboard.Is.RedrawInput;
    }

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
    /** Pure placement helpers for bounded screen regions. */
    export type Dock = t.CliScreen.Dock.Lib;
    /**
     * Layout within bounded terminal regions.
     */
    export namespace Dock {
      /** Pure bounded vertical layout for an optional bottom footer. */
      export type Bottom = t.CliScreen.Dock.Bottom;
    }
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
    /**
     * Creating a spinner without starting it.
     */
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
    /** Create a CLI table instance. */
    export type Create = t.CliTable.Create;
    /** Render fitted label/value pairs. */
    export type Pairs = t.CliTable.Pairs;
    /** One label/value pair. */
    export type Pair = t.CliTable.Pair;
  }

  /**
   * Text and layout formatting for command-line output.
   */
  export namespace Fmt {
    /** Terminal text and layout formatters. */
    export type Lib = t.CliFormat.Lib;

    /**
     * Application headers.
     */
    export namespace Header {
      /** Format an application header. */
      export type Lib = t.CliFormatHeader.Lib;
      /** Package-backed application identity accepted by the header formatter. */
      export type PackageIdentity = t.CliFormatHeader.PackageIdentity;
      /** Application-header formatting requirements. */
      export type Options = t.CliFormatHeader.Options;
    }

    /**
     * Keyboard hints.
     */
    export namespace Keyboard {
      /** Format keyboard hints and rows. */
      export type Lib = t.CliFormatKeyboard.Lib;

      /**
       * Formatting for one keyboard command.
       */
      export namespace Command {
        /** Keyboard command formatting options. */
        export type Options = t.CliFormatKeyboard.Command.Options;
      }

      /**
       * Formatting for a row of keyboard hints.
       */
      export namespace Row {
        /** Keyboard-row formatting options. */
        export type Options = t.CliFormatKeyboard.Row.Options;
        /** One candidate layout for a row of keyboard hints. */
        export type Candidate = t.CliFormatKeyboard.Row.Candidate;
      }
    }

    /**
     * Help pages.
     */
    export namespace Help {
      /** Format help pages. */
      export type Lib = t.CliFormatHelp.Lib;
      /** Content and layout for a help page. */
      export type Input = t.CliFormatHelp.Input;
      /** Header content and layout shared by both help page forms. */
      export type InputBase = t.CliFormatHelp.InputBase;
      /** Help page defined by explicit sections. */
      export type InputSections = t.CliFormatHelp.InputSections;
      /** Help page defined by shorthand fields. */
      export type InputShorthand = t.CliFormatHelp.InputShorthand;
      /** One section of a help page. */
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
     * Commit message suggestions.
     */
    export namespace Commit {
      /** Format commit message suggestions. */
      export type Lib = t.CliFormatCommit.Lib;
      /** Commit suggestion formatting options. */
      export type Options = t.CliFormatCommit.Options;
      /** Commit suggestion title options. */
      export type Title = t.CliFormatCommit.Title;
      /** Commit suggestion text styling options. */
      export type Text = t.CliFormatCommit.Text;
    }

    /**
     * Navigable help chapters.
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
       * Loading a book of help chapters.
       */
      export namespace Book {
        /** Create a help chapter loader. */
        export type Lib = t.CliFormatChapters.Book.Lib;
        /** Input used to create a chapter-book loader. */
        export type Input<TFile extends string = string> = t.CliFormatChapters.Book.Input<TFile>;
        /** Resource record reader. */
        export type Reader<TFile extends string = string> = t.CliFormatChapters.Book.Reader<TFile>;
      }

      /**
       * Reading embedded chapter resources.
       */
      export namespace Resources {
        /** Create an embedded resource reader. */
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
       * Chapter links and registered resources.
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
     * Terminal text sizing, wrapping, and clipping.
     */
    export namespace Text {
      /** Measure, fit, wrap, and clip terminal text. */
      export type Lib = t.CliFormatText.Lib;

      /**
       * Text width measured in terminal cells.
       */
      export namespace Width {
        /** Measure text in terminal cells. */
        export type Lib = t.CliFormatText.Width.Lib;

        /**
         * Available width for terminal text.
         */
        export namespace Fit {
          /** Width fitting options for terminal-aware text layout. */
          export type Options = t.CliFormatText.Width.Fit.Options;
        }
      }

      /**
       * Wrapping prose to a terminal-cell width.
       */
      export namespace Wrap {
        /** Wrap prose while preserving selected lines. */
        export type Lib = t.CliFormatText.Wrap.Lib;
        /** Prose wrapping options. */
        export type Options = t.CliFormatText.Wrap.Options;
        /** Whole-line preservation policy for wrapping. */
        export type Preserve = t.CliFormatText.Wrap.Preserve;
        /** Custom whole-line preservation predicate. */
        export type PreserveFn = t.CliFormatText.Wrap.PreserveFn;
      }

      /**
       * Shortening text with a middle ellipsis.
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
     * OSC 8 terminal hyperlinks.
     */
    export namespace Hyperlink {
      /** OSC 8 terminal hyperlink formatter. */
      export type Fn = t.CliFormat.Hyperlink.Fn;
      /** Optional hyperlink label decoration. */
      export type Options = t.CliFormat.Hyperlink.Options;
    }

    /**
     * Path display and shortening to fit the terminal.
     */
    export namespace Path {
      /** Format paths, with optional shortening to fit the terminal. */
      export type Lib = t.CliFormat.Path.Lib;
      /** Path presentation options. */
      export type FormatOptions = t.CliFormat.Path.FormatOptions;
      /** Terminal-adaptive path shortening options. */
      export type TtyOptions = t.CliFormat.Path.TtyOptions;
    }

    /**
     * Terminal formatting for service status.
     */
    export namespace Service {
      /** Format one service or a list with aligned columns. */
      export type Lib = t.CliFormat.Service.Lib;
      /** Service name, status, and display settings. */
      export type Input = t.CliFormat.Service.Input;
      /** Terminal width and automatic URL links. */
      export type Options = t.CliFormat.Service.Options;
      /** Custom formatting for service detail values. */
      export type Presentation = t.CliFormat.Service.Presentation;
      /** Synchronous detail formatter; return `undefined` to use `detail.value`. */
      export type FormatDetail = t.CliFormat.Service.FormatDetail;
      /** Optional detail formatting exposed by a service handle. */
      export type PresentationProvider = t.CliFormat.Service.PresentationProvider;
      /** Open and quit key hints; does not bind keys. */
      export type Keyboard = t.CliFormat.Service.Keyboard;
    }

    /**
     * Service URLs formatted for terminal output.
     */
    export namespace ServiceUrl {
      /** Format URLs, highlighting each origin's first appearance in a list. */
      export type Lib = t.CliFormat.ServiceUrl.Lib;
      /** A URL split into display text and its original address. */
      export type Part = t.CliFormat.ServiceUrl.Part;

      /**
       * Hostname display, including IPv4 loopback spelling.
       */
      export namespace DisplayHostname {
        export type Method = t.CliFormat.ServiceUrl.DisplayHostname.Method;
        export type Options = t.CliFormat.ServiceUrl.DisplayHostname.Options;
      }

      /**
       * URL display parts in caller-supplied order.
       */
      export namespace Parts {
        export type Method = t.CliFormat.ServiceUrl.Parts.Method;
        export type Options = t.CliFormat.ServiceUrl.Parts.Options;
      }

      /**
       * Formatting for one service URL.
       */
      export namespace Format {
        export type Method = t.CliFormat.ServiceUrl.Format.Method;
        export type Options = t.CliFormat.ServiceUrl.Format.Options;
      }

      /**
       * Formatting for a list of service URLs.
       */
      export namespace FormatList {
        export type Method = t.CliFormat.ServiceUrl.FormatList.Method;
      }
    }

    /**
     * Tree glyphs and branch prefixes for terminal output.
     */
    export namespace Tree {
      /** Tree glyphs and branch-prefix formatting. */
      export type Lib = t.CliFormat.Tree.Lib;
    }

    /**
     * Spinner labels and spacing.
     */
    export namespace Spinner {
      /** Spacing input accepted by spinner text helpers. */
      export type Spacing = t.CliFormat.Spinner.Spacing;
      /** Spinner text formatter signature. */
      export type Text = t.CliFormat.Spinner.Text;
    }

    /**
     * Horizontal rules and progress indicators.
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
