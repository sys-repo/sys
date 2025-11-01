import { type t } from './common.ts';
import { crdtRefPattern, crdtRefRecipe } from './u.id.crdtRef.ts';
import { idPattern, idRecipe } from './u.id.ts';

/**
 * Common Schema Patterns (legacy surface: pattern string + description).
 */
export const Pattern: t.SlugSchemaPatternLib = {
  idPattern,
  crdtRefPattern,
} as const;

/**
 * New value-only recipe surface (compile with @sys/schema/m.recipe: toSchema).
 */
export const PatternRecipe = {
  Id: idRecipe,
  CrdtRef: crdtRefRecipe,
} as const;
