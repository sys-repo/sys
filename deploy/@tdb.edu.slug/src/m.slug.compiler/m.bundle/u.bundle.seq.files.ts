/**
 * Transitional media-seq bundler facade.
 *
 * Keep OLD and NEW paths explicit during parity-gated integration so the two
 * implementations are never interwoven in one file.
 */
export { bundleSequenceFilepaths } from './u.bundle.seq.files_OLD.ts';
export { bundleSequenceFilepathsViaTransform } from './u.bundle.seq.files_NEW.ts';
