import { type t } from './common.ts';

/**
 * Helpers for retrieving environment variables (aka. "secrets").
 */
export declare namespace Env {
  /** Environment helper library. */
  export type Lib = {
    /** Boolean evaluators for environment conditions. */
    readonly Is: Is.Lib;

    /** Creates a reader for accessing env-vars. */
    readonly load: Load.Method;

    /** Initializes for known environments (eg. "VSCode"). */
    readonly init: (options?: InitOptions) => Promise<void>;
  };

  /** Reads env-vars from loaded dotenv values or the running process. */
  export type Reader = {
    /** Resolve an env var value. Missing keys resolve to an empty string for backwards compatibility. */
    readonly get: (key: string) => string;

    /** True when the key exists in loaded dotenv values or process env, including present-empty values. */
    readonly has: (key: string) => boolean;
  };

  /** Options for environment initialization. */
  export type InitOptions = {
    /** Suppress console output. */
    silent?: boolean;
  };

  /**
   * Dotenv loading contracts.
   */
  export namespace Load {
    /** Creates a reader for accessing env-vars. */
    export type Method = (options?: Options) => Promise<Reader>;

    /** Options for loading `.env` values. */
    export type Options = {
      /** Base directory for loading `.env` files (defaults to current working directory). */
      cwd?: t.StringDir;

      /** `.env` file lookup strategy. */
      search?: Search;
    };

    /** `.env` file lookup strategy. */
    export type Search = 'cwd' | 'upward';
  }

  /**
   * Boolean evaluators for environment conditions.
   */
  export namespace Is {
    /** Environment predicate library. */
    export type Lib = {
      /** True when running inside VSCode. */
      readonly vscode: boolean;
    };
  }
}
