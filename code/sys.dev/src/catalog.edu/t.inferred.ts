import type { t } from './common.ts';
import type { SlugSchema } from './m.slug/schema.slug.ts';
import type { TraitBindingSchema, TraitDefSchema } from './m.slug/schema.trait.ts';

export type Slug = t.Static<typeof SlugSchema>;
export type TraitBinding = t.Static<typeof TraitBindingSchema>;
export type TraitDef = t.Static<typeof TraitDefSchema>;
