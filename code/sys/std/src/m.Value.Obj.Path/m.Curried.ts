import type { t } from './common.ts';
import { ensure } from './m.Mutate.ensure.ts';
import { set } from './m.Mutate.set.ts';
import { get } from './m.Path.get.ts';
import { del } from './m.Mutate.delete.ts';

type O = Record<string, unknown>;

export const Curried: t.CurriedPathLib = {
  create<T = unknown>(path: t.ObjectPath) {
    path = Array.isArray(path) ? path : [];

    const api: t.CurriedPath<T> = {
      path,
      get(subject: O, defaultValue?: t.NonUndefined<T>) {
        return get<T>(subject, path, defaultValue);
      },
      set(subject: O, value: T) {
        return set(subject, path, value);
      },
      ensure(subject: O, defaultValue: t.NonUndefined<T>) {
        return ensure<T>(subject, path, defaultValue);
      },
      delete(subject: O) {
        return del(subject, path);
      },
    };

    return api;
  },
};
