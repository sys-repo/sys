import { type t } from './common.ts';

/**
 * Tools for working with ignore files (eg. ".gitignore").
 */
export const GlobIgnore: t.GlobIgnoreLib = {
  create(input) {
    const res: t.GlobIgnore = {};
    return res;
  },
};
