/**
 * Internal inferred types from local schemas.
 *
 * ⚠️ Not exported from the public API:
 *    JSR rejects publishing "slow types". Consumers should
 *    re-infer from the schemas (e.g. `t.Static<typeof FooSchema>`).
 */
import type { t } from './common.ts';
import type { SlugSchema, TraitBindingSchema, TraitDefSchema } from './def/mod.ts';
import type { HelloPropsSchema } from './ui/Hello/schema.ts';

/**
 * Models:
 */
export type Slug = t.Infer<typeof SlugSchema>;
export type TraitBinding = t.Infer<typeof TraitBindingSchema>;
export type TraitDef = t.Infer<typeof TraitDefSchema>;

/**
 * Components:
 */
export type HelloProps = t.Infer<typeof HelloPropsSchema>;
