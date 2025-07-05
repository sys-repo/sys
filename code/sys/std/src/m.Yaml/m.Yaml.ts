import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { parse } from './u.parse.ts';
import { syncer } from './u.syncer.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  Is,
  parse,
  syncer,
};
