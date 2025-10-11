/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types". Consumers should
 *    re-infer from the schemas (e.g. `t.Static<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import type { SlugSchema, TraitBindingSchema, TraitDefSchema } from './m.slug/mod.ts';
import type { CatalogTraitId } from './m.slug/schema.trait.registry/m.ids.ts';
import type {
  VideoPlayerPropsSchema,
  VideoRecorderPropsSchema,
} from './m.slug/schema.traits/mod.ts';
import type { HelloPropsSchema } from './ui/Hello/schema.ts';

/**
 * Core:
 */
export type Slug = t.Infer<typeof SlugSchema>;
export type TraitBinding = t.Infer<typeof TraitBindingSchema>;
export type TraitDef = t.Infer<typeof TraitDefSchema>;

/**
 * Trait Props
 */
export type VideoPlayerProps = t.Infer<typeof VideoPlayerPropsSchema>;
export type VideoRecorderProps = t.Infer<typeof VideoRecorderPropsSchema>;

/** Slug decorated with semantic registry validation (internal use). */
export type SlugValidated = t.Infer<typeof SlugSchema> & { readonly registry: CatalogTraitId[] };

/**
 * UI Components:
 */
export type HelloProps = t.Infer<typeof HelloPropsSchema>;
