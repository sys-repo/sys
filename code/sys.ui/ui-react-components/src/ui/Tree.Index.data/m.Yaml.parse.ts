import { Yaml } from '@sys/std/yaml';

import { type t } from './common.ts';
import { from } from './m.Yaml.from.ts';

export const parse: t.IndexTreeYamlLib['parse'] = (text) => {
  const js = Yaml.parse(text).data;

  if (Array.isArray(js)) {
    return from(js as readonly Record<string, t.YamlTreeSourceNode>[]);
  }

  if (js && typeof js === 'object') {
    return from(js as Record<string, t.YamlTreeSourceNode>);
  }

  return [];
};
