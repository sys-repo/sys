import type { t } from './common.ts';

import { Is } from './m.Is.ts';
import { Syncer } from './m.Syncer.ts';
import { parse, parseAst } from './u.parse.ts';
import { pathAtOffset } from './u.pathAtOffset.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  Is,
  parse,
  parseAst,
  pathAtOffset,

  Syncer,
  syncer: Syncer.create,
};
