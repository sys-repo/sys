/**
 * @module
 * Standard library for running within (non-browser) server environments.
 *
 * @example
 * ```ts
 * import { Env } from '@sys/std-s';              // Env-variables.
 * import { HttpServer } from '@sys/std-s/http';  // HTTP server.
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

/**
 * Server only.
 *
 * NB: importing these libraries into JS/ESM for bundling
 *     for the browser (eg. via Vite) will fail.
 */
export { Env } from './m.Env/mod.ts';
