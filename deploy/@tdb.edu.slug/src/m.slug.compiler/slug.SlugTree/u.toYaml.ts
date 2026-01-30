import { type t, Yaml } from './common.ts';

export const toYaml: t.SlugTreeToYaml = (doc) => {
  return Yaml.stringify(doc).data ?? '';
};
