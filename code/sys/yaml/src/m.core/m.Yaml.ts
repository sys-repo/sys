import type { t } from './common.ts';

import { Diagnostic } from './m.Diagnostic.ts';
import { EnvRef } from './m.EnvRef.ts';
import { Error } from './m.Error.ts';
import { YamlIs as Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Range } from './m.Range.ts';
import { Syncer } from './m.Syncer.ts';
import { parse, parseAst } from './u/u.parse.ts';
import { stringify } from './u/u.stringify.ts';
import { toJS } from './u/u.toJS.ts';
import { walk } from './u/u.walk.ts';

/**
 * Helpers for working with YAML.
 */
export const Yaml: t.YamlLib = Object.freeze({
  Is,
  Range,
  Error,
  Diagnostic,
  EnvRef,

  parse,
  parseAst,
  stringify,
  walk,
  toJS,

  Syncer,
  syncer: Syncer.make,

  Path,
  path: Path.make,
});
