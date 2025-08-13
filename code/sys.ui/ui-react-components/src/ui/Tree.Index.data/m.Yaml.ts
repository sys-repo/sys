import type { t } from './common.ts';
import { from } from './m.Yaml.from.ts';
import { parse } from './m.Yaml.parse.ts';

export const Yaml: t.IndexTreeYamlLib = {
  from,
  parse,
};
