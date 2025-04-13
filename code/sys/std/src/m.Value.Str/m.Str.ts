import type { t } from './common.ts';

import { bytes } from './u.bytes.ts';
import { camelToKebab } from './u.camelToKebab.ts';
import { capitalize } from './u.caps.ts';
import { diff } from './u.diff.ts';
import { plural } from './u.plural.ts';
import { shorten } from './u.shorten.ts';
import { replace, splice } from './u.splice.ts';
import { truncate } from './u.truncate.ts';
import { Lorem } from './m.Lorem.ts';

export { bytes, capitalize, diff, plural, replace, shorten, splice };

export const Str: t.StrLib = {
  Lorem,
  diff,
  splice,
  replace,
  shorten,
  capitalize,
  camelToKebab,
  plural,
  bytes,
  truncate,
} as const;
