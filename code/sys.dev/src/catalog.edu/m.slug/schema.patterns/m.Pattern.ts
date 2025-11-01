import { type t } from './common.ts';
import { CrdtRef } from './u.CrdtRef.ts';
import { Id } from './u.Identity.ts';

/**
 * Value-only recipe surface for schema patterns.
 * Compile with @sys/schema/recipe: toSchema.
 */
export const Pattern: t.SlugPatternLib = {
  Id,
  CrdtRef,
} as const;
