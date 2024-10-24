/**
 * @module
 * Standard library for running within (non-browser) server environments.
 *
 * @example
 * ```ts
 * import { Env } from '@sys/std-s';          // Env-variables.
 * import { Fs, Path } from '@sys/std-s';     // Filesystem tools.
 * import { HttpServer } from '@sys/std-s';   // HTTP server.
 * import { Colors, c } from '@sys/std-s';    // Terminal color formatting.
 * ```
 */
export { Pkg } from './common.ts';

/**
 * Web AND Server
 */
export {
  Args,
  Async,
  Date,
  D,
  Http,
  Immutable,
  ObjectPath,
  R,
  Rx,
  Semver,
  Time,
  Value,
  rx,
} from '@sys/std';

/**
 * Server only.
 *
 * NB: importing these libraries into JS that is bundled
 *     for the browser will fail.
 */
export { Cli } from './m.Cli/mod.ts';
export { Env } from './m.Env/mod.ts';
export { Colors, c } from './m.Fmt/mod.ts';
export { Fs, Path } from './m.Fs/mod.ts';
export { Cmd } from './m.Process/mod.ts';
export { HttpServer } from './m.Server.Http/mod.ts';
