import { type t } from './common.ts';

export const Tmpl: t.TmplLib = {
  create(source: t.StringDir) {
    return { source };
  },
};
