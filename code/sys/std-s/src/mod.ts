/**
 * @module
 * Standard library for running within (non-browser) server environments.
 *
 * @example
 * ```ts
 * import { Env } from '@sys/std-s';              // Env-variables.
 * import { HttpServer } from '@sys/std-s/http';  // HTTP server.
 * import { Fs, Path } from '@sys/std-s/fs';      // Filesystem tools (alias to "@sys/fs")
 * import { Colors, c } from '@sys/std-s/fmt';    // Terminal color formatting (alias to "@sys/cli/fmt")
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Web "AND" Server.
 */
export {
  Args,
  Async,
  D,
  Date,
  Http,
  Immutable,
  ObjectPath,
  R,
  Rx,
  rx,
  Time,
  Value,
} from '@sys/std';
export { Semver } from '@sys/std/semver';

/**
 * Server only.
 *
 * NB: importing these libraries into JS/ESM for bundling
 *     for the browser (eg. via Vite) will fail.
 */
export { Env } from './m.Env/mod.ts';
export { HttpServer } from './m.Server.Http/mod.ts';
