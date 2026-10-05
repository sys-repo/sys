/**
 * Tools for working with a CLI spinner.
 */
export declare namespace CliSpinner {
  export type Lib = {
    /** Create a new spinner instance without starting it. */
    create(text?: string, options?: Create.Options): Instance;
    /** Create and start a new spinner instance. */
    start(text?: string, options?: Options): Instance;
    /** Run async work with a started spinner that is always stopped afterwards. */
    with<T>(text: string, run: (spinner: Instance) => Promise<T>, options?: Options): Promise<T>;
  };

  /** Semantic terminal-output target used by the spinner owner. */
  export type OutputTarget = 'stdout' | 'stderr';

  /** Spinner creation contracts. */
  export namespace Create {
    /** Options for creating a spinner without starting it. */
    export type Options = { target?: OutputTarget };
  }

  /** Options for creating and conditionally starting a spinner. */
  export type Options = Create.Options & { silent?: boolean };

  export type Instance = {
    /** Current spinner label text. */
    text: string;
    /** Start or restart the spinner, optionally updating its text. */
    start(text?: string): Instance;
    /** Stop the spinner without marking success or failure. */
    stop(): Instance;
    /** Stop the spinner and mark the operation as successful. */
    succeed(text?: string): Instance;
    /** Stop the spinner and mark the operation as failed. */
    fail(text?: string): Instance;
  };
}
