import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  create(source: t.StringDir, target: t.StringDir): Tmpl;
};

/**
 * A template copier.
 */
export type Tmpl = {
  readonly source: { dir: t.StringDir };
  readonly target: { dir: t.StringDir };
};
