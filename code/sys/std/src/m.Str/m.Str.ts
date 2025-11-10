import { type t, SPACE } from './common.ts';

import { Lorem } from './m.Lorem.ts';
import { builder } from './u.builder.ts';
import { bytes } from './u.bytes.ts';
import { camelToKebab } from './u.camelToKebab.ts';
import { capitalize } from './u.caps.ts';
import { dedent } from './u.dedent.ts';
import { diff } from './u.diff.ts';
import { ellipsize } from './u.ellipsize.ts';
import { plural } from './u.plural.ts';
import { replaceAll } from './u.replace.ts';
import { trimEdgeNewlines } from './u.trim.ts';
import { truncate } from './u.truncate.ts';

export { bytes, capitalize, diff, plural };

export const Str: t.StrLib = {
  SPACE,
  Lorem,
  lorem: Lorem.text,
  diff,
  capitalize,
  camelToKebab,
  plural,
  bytes,
  truncate,
  ellipsize,
  replaceAll,
  dedent,
  trimEdgeNewlines,
  builder,
} as const;
