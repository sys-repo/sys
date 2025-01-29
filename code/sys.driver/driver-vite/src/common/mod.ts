export type * as t from './t.ts';

export { pkg } from '../pkg.ts';
export * from './libs.ts';

export const PATHS = {
  dist: 'dist/',
  backup: '-backup/',
  tmp: '.tmp/',
  tmpl: {
    tmp: '.tmp/-tmpl/',
    source: 'src/-tmpl/',
    json: 'src/m.Vite.Tmpl/-bundle.json',
  },
} as const;
