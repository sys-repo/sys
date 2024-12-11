import type { t } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';
import { copy } from './u.copy.ts';

export const Tmpl: t.TmplLib = {
  create(source, fn) {
    const tmpl: t.Tmpl = {
      source: Wrangle.dir(source),
      copy: (target) => copy(tmpl.source, Wrangle.dir(target), fn),
    };
    return tmpl;
  },
};
