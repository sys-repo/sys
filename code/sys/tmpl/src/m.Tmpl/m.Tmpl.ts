import type { t } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';
import { copy } from './u.copy.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (source, fn) => {
  const tmpl: t.Tmpl = {
    source: Wrangle.dir(source),
    copy: (target) => copy(tmpl.source, Wrangle.dir(target), fn),
  };
  return tmpl;
};

/**
 * Library for copying template files.
 */
export const Tmpl: t.TmplLib = {
  create,
};
