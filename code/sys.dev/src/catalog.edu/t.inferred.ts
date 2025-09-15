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
export type Slug = t.Static<typeof SlugSchema>;
export type TraitBinding = t.Static<typeof TraitBindingSchema>;
export type TraitDef = t.Static<typeof TraitDefSchema>;

/**
 * Components:
 */
export type HelloProps = t.Infer<typeof HelloPropsSchema>;
