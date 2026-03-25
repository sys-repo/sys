/**
 * Tools for working with a CLI spinner.
 */
export declare namespace CliSpinner {
  export type Options = {
    silent?: boolean;
  };

  export type Lib = {
    /** Create a new spinner instance without starting it. */
    create(text?: string): Instance;
    /** Create and start a new spinner instance. */
    start(text?: string, options?: Options): Instance;
  };

  export type Instance = {
    text: string;
    start(text?: string): Instance;
    stop(): Instance;
    succeed(text?: string): Instance;
    fail(text?: string): Instance;
  };
}
