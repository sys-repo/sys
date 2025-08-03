import { type t } from './common.ts';
import { deepGet } from './m.Path.get.ts';
import { deepSet } from './m.Path.set.ts';

export const create: t.YamlPathLib['create'] = <T = unknown>(path: t.ObjectPath) => {
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
   * API:
   */
  const api: t.YamlPath<T> = {
    path,
    get,
    exists: (subject) => deepGet(subject?.contents, path) !== undefined,
    set: (subject, value) => deepSet(subject, path, value),
  };
  return api;
};
