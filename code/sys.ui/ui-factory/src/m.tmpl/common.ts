export * from '../common.ts';

export { c, Cli } from '@sys/cli';
export { Fs, Path } from '@sys/fs';
export { FileMap } from '@sys/fs/filemap';
export { Semver } from '@sys/std/semver';
export { TmplEngine } from '@sys/tmpl-engine';

/**
 * Constants:
 */
export const PATHS = {
  tmpl: {
    source: '-tmpl/',
    json: 'src/m.tmpl/-bundle.json',
  },
} as const;
