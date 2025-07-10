import { type t } from './common.ts';

export const Curried: t.CurriedPathLib = {
  create(path) {
    path = Array.isArray(path) ? path : [];

    /**
     * API:
     */
    const api: t.CurriedPath = { path };
    return api;
  },
};
