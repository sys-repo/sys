import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { parse, parseDocument } from './u.parse.ts';
import { pathAtOffset } from './u.pathAtOffset.ts';
import { syncer } from './u.syncer.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  Is,
  parse,
  parseDocument,
  pathAtOffset,
  syncer,
};
