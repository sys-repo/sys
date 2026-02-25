/**
 * Transitional media-seq bundler facade.
 *
 * `bundleSequenceFilepaths` remains pinned to OLD until the NEW path is promoted.
 * Explicit `_OLD` / `_NEW` exports exist to support parity-gated migration work.
 */
export { bundleSequenceFilepaths_OLD } from './u.bundle.seq.files_OLD.ts';
export { bundleSequenceFilepaths_NEW } from './u.bundle.seq.files_NEW.ts';

// Stable compiler entrypoint (still OLD during this transition pass).
export { bundleSequenceFilepaths_OLD as bundleSequenceFilepaths } from './u.bundle.seq.files_OLD.ts';
