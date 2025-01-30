export { pkg } from '../pkg.ts';
export * from './libs.ts';

export type * as t from './t.ts';

export const PATHS = {
  inDir: './',
  srcDir: './docs',
  dist: './dist',
  backup: '-backup',
  vitepressCache: './.vitepress/cache',
  tmpl: {
    tmp: './.tmp/-tmpl',
    source: './src/-tmpl',
    json: './src/m.Vitepress.Tmpl/-bundle.json',
  },
} as const;
