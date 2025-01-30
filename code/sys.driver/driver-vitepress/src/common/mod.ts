export { pkg } from '../pkg.ts';
export * from './libs.ts';

export type * as t from './t.ts';

export const PATHS = {
  inDir: './',
  srcDir: './docs',
  dist: './dist',
  backup: '-backup',
  vitepressCache: './.vitepress/cache',
  tmp: './.tmp',
  tmpl: {
    tmp: './.tmp/-tmpl',
    source: './src/-tmpl',
    json: './src/m.Vitepress.Tmpl/-bundle.json',
  },
  sys: {
    jsr: './.sys/jsr',
  },
} as const;
