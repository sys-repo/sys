import { type t, Err, Semver } from './common.ts';
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
      get error() {
        return errors.toError();
      },

      latest(name) {
        name = parse(name).name;
        const matches = items.filter((m) => m.name === name);
        const versions = matches.map((m) => Semver.stripPrefix(m.version));
        const sorted = Semver.sort(versions, { order: 'desc' });
        return sorted[0] ?? '';
      },
    };

    return api;
  },
};
