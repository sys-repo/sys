import { type t, Err } from './common.ts';
import { Latest } from './u.latest.ts';
import { parse } from './u.parse.ts';

export const Modules: t.EsmModulesLib = {
  create(input = []) {
    type E = t.EsmParsedImport;
    const errors = Err.errors();
    const items = input.map((m) => (typeof m === 'string' ? parse(m) : { ...m }) as E);
    items.filter((m) => m.error).forEach((m) => errors.push(m.error));

    const api: t.EsmModules = {
      get ok() {
        return errors.ok;
      },
      get items() {
        return items;
      },
      get count() {
        return items.length;
      },
      get error() {
        return errors.toError();
      },
      latest(input) {
        return typeof input === 'string'
          ? Latest.name(items, input)
          : (Latest.deps(items, input) as any); // NB: return-type hack.
      },
    };

    return api;
  },
};
