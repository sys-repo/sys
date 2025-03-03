export type * as t from './t.ts';

export { pkg } from '../pkg.ts';
export * from './libs.ts';
export * from './u.workspace.ts';

export const PATHS = {
  base: './',
  dist: 'dist/',
  backup: '-backup/',
  tmp: '.tmp/',
  html: { index: 'index.html' },
  tmpl: {
    tmp: '.tmp/-tmpl/',
    source: 'src/-tmpl/',
    json: 'src/m.Vite.Tmpl/-bundle.json',
  },
} as const;
