/**
 * @module
 * Tools for watching file-system changes.
 *
 * @example
 * ```ts
 * const watcher = await Fs.watch('path/to/subject');
 *
 * // Listen for changes (via Observable).
 * watcher.$.subscribe((e) => {    });
 *
 * // Clean up.
 * watcher.dispose();
 * ```
 */
export { Watch } from './m.Watch.ts';
