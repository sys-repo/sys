/**
 * @module Ignore
 * Provides functionality to parse and evaluate ignore patterns,
 * similar to `.gitignore` files.
 *
 * @example
 * ```ts
 * import { Ignore } from '@sys/std/ignore';
 *
 * // Initialize with ignore patterns.
 * const gitignore = Ignore.create([
 *   'node_modules/',
 *   '*.log',
 *   '!important.log',
 * ]);
 *
 * // Check if paths are ignored
 * console.log(gitignore.isIgnored('node_modules/package/index.js')); // true
 * console.log(gitignore.isIgnored('app.log'));                       // true
 * console.log(gitignore.isIgnored('important.log'));                 // false
 * ```
 */
export { Ignore } from './m.Ignore.ts';
