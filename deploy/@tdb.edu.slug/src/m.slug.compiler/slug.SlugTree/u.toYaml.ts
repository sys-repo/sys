import { type t, Yaml } from './common.ts';

export const toYaml: t.SlugTreeToYaml = (tree) => {
  return Yaml.stringify(tree).data ?? '';
};
