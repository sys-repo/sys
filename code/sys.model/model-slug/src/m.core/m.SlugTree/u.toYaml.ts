import { type t, Yaml } from '../common.ts';

export const toYaml: t.SlugTree.ToYaml = (doc) => {
  return Yaml.stringify(doc).data ?? '';
};
