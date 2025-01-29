export type * as t from './t.ts';

export { pkg } from '../pkg.ts';
export * from './libs.ts';

export const PATHS = {
  tmp: '.tmp/-tmpl/',
  dist: 'dist/',
  backup: '-backup/',
  tmpl: {
    source: 'src/-tmpl/',
    json: 'src/m.Vite.Tmpl/-bundle.json',
  },
} as const;
