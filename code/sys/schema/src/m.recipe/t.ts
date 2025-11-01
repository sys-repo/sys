/**
 * Value-only schema recipes.
 * Compile recipes to concrete TSchema at composition sites.
 *
 * Invariants:
 * - Add new fields/kinds additively.
 * - No generic "options" bags; every option maps to a real backend feature.
 *
 * ___
 * Note: no TypeBox imports here, JSX-safe.
 */
import type { t } from './common.ts';

export type * from './t.composite.ts';
export type * from './t.primitive.ts';

/**
 * Functional DSL surface for building Recipe nodes.
 * Mirrors the exports of m.Value.ts without importing it here.
 */
export type ValueLib = {
  string(o?: Omit<t.StrSpec, 'kind'>): t.StrSpec;
  number(o?: Omit<t.NumSpec, 'kind'>): t.NumSpec;
  boolean(o?: Omit<t.BoolSpec, 'kind'>): t.BoolSpec;
  literal(value: t.LitSpec['value']): t.LitSpec;

  array(items: t.Recipe, o?: Omit<t.ArrSpec, 'kind' | 'items'>): t.ArrSpec;
  object(props: t.ObjSpec['props'], o?: Omit<t.ObjSpec, 'kind' | 'props'>): t.ObjSpec;
  union(variants: readonly t.Recipe[], o?: Omit<t.UnionSpec, 'kind' | 'variants'>): t.UnionSpec;

  optional(of: t.Recipe): t.OptSpec;
};

/** Discriminated union for all recipe nodes */
export type Recipe =
  | t.StrSpec
  | t.NumSpec
  | t.BoolSpec
  | t.LitSpec
  | t.ArrSpec
  | t.ObjSpec
  | t.UnionSpec
  | t.OptSpec;

/**
 * Compiles a value-level {@link t.Recipe} into a concrete TypeBox {@link t.TSchema}.
 * The sole boundary between declarative recipe grammar and runtime schema form.
 */
export type RecipeToSchema = (from: t.Recipe) => t.TSchema;
