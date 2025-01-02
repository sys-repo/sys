export { pkg } from '../pkg.ts';
export * from './libs.ts';

export type * as t from './t.ts';

export const PATHS = {
  inDir: './',
  tmp: '.tmp/-tmpl',
  backup: '-backup',
  dist: 'dist',
  tmpl: {
    source: 'src/-tmpl/files',
    json: 'src/-tmpl/u.tmpl/tmpl.bundle.json',
  },
} as const;
