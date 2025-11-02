import { type t } from './common.ts';

import { CrdtRef } from './u.ref.CrdtRef.ts';
import { Id } from './u.ref.Id.ts';
import { Cropmarks } from './u.ui.Cropmarks.ts';
import { Css } from './u.ui.Css.ts';

/**
 * Value-only recipe surface for schema patterns.
 * Compile with @sys/schema/recipe: `toSchema` at boundary.
 */
export const Pattern: t.SlugPatternLib = {
  Id,
  CrdtRef,
  UI: { Css, Cropmarks },
} as const;
