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
    copy(targetDir, options = {}) {
      const { force } = options;
      const target = Wrangle.dir(targetDir);
      return copy({ source, target, fn, force });
    },
  };
  return tmpl;
};
