export * from '../common.ts';

export { c, Cli } from '@sys/cli';
export { Fs, Path } from '@sys/fs';
export { FileMap } from '@sys/fs/filemap';
export { Semver } from '@sys/std/semver';
export { Tmpl as TmplEngine } from '@sys/tmpl/fs';

/**
 * Constants:
 */
export const PATHS = {
  tmpl: {
    tmp: '.tmp/-tmpl/',
    source: 'src/-tmpl/',
    json: 'src/m.tmpl/-bundle.json',
  },
} as const;
