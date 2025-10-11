import type { t } from './common.ts';

import { Ast } from './m.Ast.ts';
import { Diagnostic } from './m.Diagnostic.ts';
import { Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Syncer } from './m.Syncer.ts';
import { parse, parseAst } from './u.parse.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = {
  Is,
  Ast,
  Diagnostic,

  parse,
  parseAst,

  Syncer,
  syncer: Syncer.make,

  Path,
  path: Path.make,
};
