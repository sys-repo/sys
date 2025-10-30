/**
 * @module Slug-Schemas
 * Core structural schemas for slugs and trait bindings.
 */
export { Pattern } from './m.Pattern.ts';
export {
  SlugTreeItemSchema,
  SlugTreeItemSchemaInternal,
  SlugTreePropsSchema,
  SlugTreePropsSchemaInternal,
} from './schema.slug.tree.ts';
export {
  SlugMinimalSchema,
  SlugMinimalSchemaInternal,
  SlugRefSchema,
  SlugRefSchemaInternal,
  SlugSchema,
  SlugSchemaInternal,
  SlugWithDataSchema,
  SlugWithDataSchemaInternal,
} from './schema.slug.ts';
export { TraitBindingSchema, TraitDefSchema } from './schema.trait.ts';
