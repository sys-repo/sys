import type { t } from './common.ts';

import { Diagnostic } from './m.Diagnostic.ts';
import { YamlIs as Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Range } from './m.Range.ts';
import { Syncer } from './m.Syncer.ts';
import { parse, parseAst } from './u.parse.ts';
import { toJS } from './u.toJS.ts';
import { walk } from './u.walk.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  Is,
  Range,
  Diagnostic,

  parse,
  parseAst,
  walk,
  toJS,

  Syncer,
  syncer: Syncer.make,

  Path,
  path: Path.make,
};
