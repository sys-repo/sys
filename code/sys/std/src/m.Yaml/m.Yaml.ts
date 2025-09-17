import type { t } from './common.ts';

import { Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Syncer } from './m.Syncer.ts';
import { parse, parseAst } from './u.parse.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  parse,
  parseAst,

  Is,
  Syncer,
  syncer: Syncer.make,
  Path,
  path: Path.make,
};
