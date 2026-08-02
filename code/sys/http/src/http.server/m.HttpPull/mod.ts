/**
 * @module HttpPull
 *
 * Materializes HTTP resources into filesystem destinations.
 *
 * Legacy pulls mirror URLs into a directory. Verified pulls bind each source to an explicit
 * checksum and root-relative target, then publish through a Rooted capability. Both `toDir` and
 * `stream` execute through the same operation; `stream` additionally exposes bounded event views
 * and cancellation.
 */
export { HttpPull } from './m.HttpPull.ts';
