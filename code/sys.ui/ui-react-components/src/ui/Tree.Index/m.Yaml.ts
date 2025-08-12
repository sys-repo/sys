import type { t } from './common.ts';

import { at } from './m.Yaml.at.ts';
import { find } from './m.Yaml.find.ts';
import { from } from './m.Yaml.from.ts';
import { parse } from './m.Yaml.parse.ts';

export const Yaml: t.IndexTreeYamlLib = {
  from,
  at,
  find,
  parse,
};
