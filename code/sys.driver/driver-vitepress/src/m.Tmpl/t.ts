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
  readonly source: t.TmplDir;
  readonly target: t.TmplDir;
  copy(): Promise<void>;
};

export type TmplDir = {
  readonly dir: t.StringDir;
  ls(): Promise<t.StringPath[]>;
};
