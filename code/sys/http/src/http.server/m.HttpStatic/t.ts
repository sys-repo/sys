import type { t } from './common.ts';

/**
 * Static HTTP server lifecycle endpoint.
 */
export declare namespace HttpStatic {
  /** Public static-server lifecycle API. */
  export type Lib = {
    /** Start a static file server and return the standard HTTP server lifecycle handle. */
    start(args?: StartArgs): Promise<t.HttpServerStarted>;
  };

  /** Arguments passed to [HttpStatic.start]. */
  export type StartArgs = {
    /** Base directory used to resolve relative `dir` values. Defaults to the process cwd. */
    cwd?: string;

    /** Static root to serve. Relative paths resolve against `cwd`. Defaults to `.`. */
    dir?: string;

    /** Listen hostname. Defaults to the underlying HTTP server convention. */
    hostname?: string;

    /** Listen port. Use `0` for an ephemeral port. */
    port?: number;

    /** Suppress startup output. */
    silent?: boolean;

    /** Enable existing HTTP server keyboard handling. */
    keyboard?: boolean | t.HttpServerStartKeyboardOptions;

    /** Display name forwarded to the HTTP server startup output. */
    name?: string;

    /** Extra startup output fields forwarded to the HTTP server. */
    info?: Record<string, string>;

    /** Canonical @sys lifecycle bridge. */
    until?: t.UntilInput;
  };
}
