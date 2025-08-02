import { type t } from './common.ts';

export const create: t.YamlPathLib['create'] = (ast, path) => {
  /**
   * API:
   */
  const api: t.YamlPath = {
    ast,
    path,
  };
  return api;
};
