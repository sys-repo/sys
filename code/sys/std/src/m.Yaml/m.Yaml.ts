import type { t } from './common.ts';
import { parse } from './u.parse.ts';
import { syncer } from './u.syncer.ts';

export const Yaml: t.YamlLib = {
  parse,
  syncer,
};
