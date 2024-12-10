import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  create(source: t.StringDir): Tmpl;
};

/**
 * A template copier.
 */
export type Tmpl = {
  source: t.StringDir;
};
