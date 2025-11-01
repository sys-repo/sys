import type { t } from './common.ts';

type Str = t.Schema.Spec.Str;

/**
 * Value-only recipe surface for schema patterns.
 * Compile with @sys/schema/recipe: toSchema.
 */
export type SlugPatternLib = {
  Id(o?: Omit<Str, 'kind' | 'pattern'>): t.SpecWith<Str, 'pattern' | 'description'>;
  CrdtRef(o?: Omit<Str, 'kind' | 'pattern'>): t.SpecWith<Str, 'pattern' | 'description'>;
};
