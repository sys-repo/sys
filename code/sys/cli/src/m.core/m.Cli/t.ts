import type { t } from '../common.ts';

/**
 * Root CLI type namespace.
 */
export declare namespace Cli {
  /** Tools for CLI's (command-line-interface). */
  export type Lib = {
    /** Argument parsing helpers */
    readonly Args: t.Args.Lib;

    /** Tools for for working with string paths. */
    readonly Path: t.Path.Lib;

    /** Tools for working with CLI tables. */
    readonly Table: t.CliTableLib;

    /** Tools for working with a CLI spinner. */
    readonly Spinner: t.CliSpinner.Lib;

    /** Common formatting heleprs. */
    readonly Fmt: t.CliFormat.Lib;

    /** Predicate helpers for CLI runtime capabilities. */
    readonly Is: t.CliIsLib;

    /** Tools for working with the keyboard within a CLI. */
    readonly Keyboard: t.CliKeyboardLib;

    /** Index of input prompts */
    readonly Input: t.CliInputLib;
    /** Direct access to low-level prompt primitives. */
    readonly Prompt: t.CliPromptLib; // ← available where direct access to prompt primitives is needed.

    /** Tools for working with a terminal screen. */
    readonly Screen: t.CliScreenLib;

    /** Parse command-line argments into an object (argv). */
    args: t.Args.Lib['parse'];

    /** Create a new Table generator instance. */
    table: t.CliTableLib['create'];

    /** Create and start a new spinner instance. */
    spinner: t.CliSpinner.Lib['start'];

    /** Wait for the specified milliseconds. */
    wait: t.Time.Lib['wait'];

    /** Listen to keypress events. */
    keypress: t.CliKeyboardLib['keypress'];

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
  }
}

/** Tools for CLI's (command-line-interface). */
export type CliLib = Cli.Lib;
