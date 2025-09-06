/**
 * @module HttpPull
 *
 * HTTP → FS utilities.
 * Provides functions for pulling remote resources into a local directory:
 *  - IO:   download URLs to a directory, with optional progress events.
 *  - Map:  pure helpers for rebasing/mirroring URL paths into relative POSIX paths.
 *
 * Use when you need to "mirror" or "rebase" a set of HTTP assets into the filesystem.
 */
export { HttpPull } from './m.HttpPull.ts';
