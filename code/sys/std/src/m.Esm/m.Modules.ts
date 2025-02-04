import { type t, Err } from './common.ts';
import { parse } from './u.parse.ts';

export const Modules: t.EsmModulesLib = {
  create(input = []) {
    const errors = Err.errors();
    const items = input.map((m) => (typeof m === 'string' ? parse(m) : m) as t.EsmParsedImport);
    items.filter((m) => m.error).forEach((m) => errors.push(m.error));

    const api: t.EsmModules = {
      get ok() {
        return errors.ok;
      },
      get items() {
        return items;
      },
      get error() {
        return errors.toError();
      },
    };

    return api;
  },
};
