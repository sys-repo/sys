import type { t } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';
import { copy } from './u.copy.ts';

/**
 * Create a new directory template.
 */
export const create: t.TmplFactory = (sourceDir, fn) => {
  const source = Wrangle.dir(sourceDir);
  const tmpl: t.Tmpl = {
    get source() {
      return source;
    },
    copy(target, options = {}) {
      return copy(source, Wrangle.dir(target), fn, options);
    },
  };
  return tmpl;
};
