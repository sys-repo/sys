import { type t } from './common.ts';

export const Tmpl: t.TmplLib = {
  create(source, target) {
    return {
      source: { dir: source },
      target: { dir: target },
    };
  },
};
