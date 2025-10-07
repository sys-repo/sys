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
} as const;
