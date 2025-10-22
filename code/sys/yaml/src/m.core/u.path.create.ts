import { type t } from './common.ts';
import { deepGet } from './u.path.get.ts';
import { deepSet } from './u.path.set.ts';

export const make: t.YamlPathLib['make'] = <T = unknown>(path: t.ObjectPath) => {
  path = [...path];

  /**
   * Method: get
   */
  function get(subject?: t.YamlAst): T | undefined;
  function get(subject: t.YamlAst | undefined, defaultValue: t.NonUndefined<T>): T;
  function get(subject: t.YamlAst | undefined, defaultValue?: t.NonUndefined<T>): T | undefined {
    const result = deepGet(subject?.contents, path);
    if (result === undefined) {
      return defaultValue as T | undefined;
    }
    return result as T;
  }

  /**
   * Method: ensure
   */
  function ensure(subject: t.YamlAst, defaultValue: t.NonUndefined<T>): T {
    const current = api.get(subject);
    if (current === undefined) {
      api.set(subject, defaultValue);
      return defaultValue;
    }
    return current;
  }

  /**
   * Method: join
   */
  function join<T = unknown>(subpath: t.ObjectPath) {
    return make<T>([...path, ...(subpath ?? [])]);
  }

  /**
   * API:
   */
  const api: t.YamlPath<T> = {
    path,
    get,
    exists: (subject) => deepGet(subject?.contents, path) !== undefined,
    ensure,
    set: (subject, value) => deepSet(subject, path, value),
    delete: (subject) => deepSet(subject, path, undefined),
    join,
  };
  return api;
};
