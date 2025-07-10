import { type t } from './common.ts';
import { get } from './m.Path.get.ts';

export const Curried: t.CurriedPathLib = {
  create<T = unknown>(path: t.ObjectPath) {
    path = Array.isArray(path) ? path : [];
    const api: t.CurriedPath<T> = {
      path,
      get(subject: unknown, defaultValue?: t.NonUndefined<T>) {
        return get<T>(subject, path, defaultValue);
      },
    };
    return api;
  },
};
