export { pkg } from '../pkg.ts';
export * from './libs.ts';
export * from './u.Log.ts';

export type * as t from './t.ts';

export const PATHS = {
  tmp: '.tmp/-tmpl',
  source: 'src/-tmpl/files',
  json: 'src/-tmpl/u/tmpl.bundle.json',
} as const;
