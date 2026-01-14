/**
 * @module @sys/driver-ffmpeg
 *
 * Thin system driver for FFmpeg tooling.
 *
 * Exposes typed, low-level capabilities (e.g. `ffprobe` inspection)
 * via `@sys/process`. No policy, no UI, no schema coupling.
 *
 * Designed for bundlers and tooling, not playback.
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';
