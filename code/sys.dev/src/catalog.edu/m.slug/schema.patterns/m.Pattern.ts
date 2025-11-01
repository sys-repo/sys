import { type t } from './common.ts';

import { CrdtRef } from './u.CrdtRef.ts';
import { Cropmarks } from './u.Cropmarks.ts';
import { Css } from './u.Css.ts';
import { Id } from './u.Identity.ts';

/**
 * Value-only recipe surface for schema patterns.
 * Compile with @sys/schema/recipe: `toSchema` at boundary.
 */
export const Pattern: t.SlugPatternLib = {
  Id,
  CrdtRef,
  UI: { Css, Cropmarks },
} as const;
