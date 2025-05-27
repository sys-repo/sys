import type { t } from './common.ts';

import { Doc } from './m.Doc.ts';
import { Lorem } from './m.Lorem.ts';
import { bytes } from './u.bytes.ts';
import { camelToKebab } from './u.camelToKebab.ts';
import { capitalize } from './u.caps.ts';
import { diff } from './u.diff.ts';
import { plural } from './u.plural.ts';
import { replaceAll } from './u.replace.ts';
import { shorten } from './u.shorten.ts';
import { truncate } from './u.truncate.ts';

export { bytes, capitalize, diff, plural, shorten };

export const Str: t.StrLib = {
  Doc,
  Lorem,
  lorem: Lorem.text,
  diff,
  shorten,
  capitalize,
  camelToKebab,
  plural,
  bytes,
  truncate,
  replaceAll,
} as const;
