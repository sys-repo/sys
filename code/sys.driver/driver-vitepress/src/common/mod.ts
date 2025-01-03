export { pkg } from '../pkg.ts';
export * from './libs.ts';

export type * as t from './t.ts';

export const PATHS = {
  inDir: './',
  tmp: '.tmp/-tmpl',
  dist: 'dist',
  backup: '-backup',
  vitepressCache: '.vitepress/cache',
  tmpl: {
    source: 'src/-tmpl/files',
    json: 'src/-tmpl/u.tmpl/tmpl.bundle.json',
  },
} as const;
