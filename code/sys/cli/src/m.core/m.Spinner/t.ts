/**
 * Tools for working with a CLI spinner.
 */
export declare namespace CliSpinner {
  export type Options = {
    start?: boolean;
    silent?: boolean;
  };

  export type Lib = {
    /** Create (and start) a new spinner instance. */
    create(text?: string, options?: Options): Instance;
  };

  export type Instance = {
    text: string;
    start(text?: string): Instance;
    stop(): Instance;
    succeed(text?: string): Instance;
    fail(text?: string): Instance;
  };
}
