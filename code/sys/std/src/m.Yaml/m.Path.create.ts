import { type t } from './common.ts';
import { deepGet } from './m.Path.get.ts';

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
   * Method: exists
   */
  function exists(subject?: t.YamlAst): boolean {
    return deepGet(subject?.contents, path) !== undefined;
  }

  /**
   * API:
   */
  const api: t.YamlPath<T> = {
    path,
    get,
    exists,
  };
  return api;
};
