import type { t } from './common.ts';
type Str = t.Schema.Spec.Str;

export type * from './t.ui.ts';

/**
 * Value-only recipe surface for schema patterns.
 * Compile with @sys/schema/recipe: `toSchema` at boundary.
 */
export type SlugPatternLib = {
  Id(o?: Omit<Str, 'kind' | 'pattern'>): t.SpecWith<Str, 'pattern' | 'description'>;
  CrdtRef(o?: Omit<Str, 'kind' | 'pattern'>): t.SpecWith<Str, 'pattern' | 'description'>;
  readonly UI: {
    readonly Css: t.CssSpecLib;
    readonly Cropmarks: t.CropmarksSpecLib;
  };
};
