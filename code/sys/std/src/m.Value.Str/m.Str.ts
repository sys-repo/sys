import type { t } from './common.ts';
import { bytes } from './u.bytes.ts';
import { capitalize } from './u.caps.ts';
import { diff } from './u.diff.ts';
import { plural } from './u.plural.ts';
import { shorten } from './u.shorten.ts';
import { replace, splice } from './u.splice.ts';

export { bytes, capitalize, diff, plural, replace, shorten, splice };

export const Str: t.StrLib = {
  diff,
  splice,
  replace,
  shorten,
  capitalize,
  plural,
  bytes,
} as const;
