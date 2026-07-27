import { type t, SPACE } from './common.ts';

import { Compare } from './m.Compare.ts';
import { Lorem } from './m.Lorem.ts';
import { builder } from './u/u.builder.ts';
import { bytes } from './u/u.bytes.ts';
import { camelToKebab } from './u/u.camelToKebab.ts';
import { capitalize } from './u/u.caps.ts';
import { count } from './u/u.count.ts';
import { dedent } from './u/u.dedent.ts';
import { diff } from './u/u.diff.ts';
import { ellipsize } from './u/u.ellipsize.ts';
import { ensureSlashWrapped } from './u/u.ensure.ts';
import { indent } from './u/u.indent.ts';
import { plural } from './u/u.plural.ts';
import { replaceAll } from './u/u.replace.ts';
import { splitPathSegments } from './u/u.split.ts';
import { stripPrefixOnce, stripTrailingPathSegment } from './u/u.strip.ts';
import {
  trimEdgeNewlines,
  trimHttpScheme,
  trimLeadingDotSlash,
  trimLeadingSlashes,
  trimSlashes,
  trimTrailingSlashes,
} from './u/u.trim.ts';
import { truncate } from './u/u.truncate.ts';

export { bytes, capitalize, diff, plural };

export const Str: t.Str.Lib = {
  SPACE,
  Compare,
  Lorem,
  lorem: Lorem.text,
  builder,
  diff,
  capitalize,
  camelToKebab,
  plural,
  bytes,
  truncate,
  ellipsize,
  replaceAll,
  indent,
  dedent,
  count,
  ensureSlashWrapped,
  trimEdgeNewlines,
  trimSlashes,
  trimLeadingSlashes,
  trimTrailingSlashes,
  trimHttpScheme,
  trimLeadingDotSlash,
  stripPrefixOnce,
  stripTrailingPathSegment,
  splitPathSegments,
};
