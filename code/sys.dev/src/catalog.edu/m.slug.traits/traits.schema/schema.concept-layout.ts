import { type t, Pattern, Type as T } from './common.ts';

/**
 * Properties: Concept Layout.
 */
export const ConceptLayoutPropsSchemaInternal = T.Object(
  {
    /**
     * CRDT document reference for this layout's config/state.
     * Accepts:
     *  - "crdt:create"
     *  - "crdt:<uuid|base62-28>/[path]"
     *  - "urn:crdt:<uuid|base62-28>/[path]"
     */
    slug: T.String({
      ...Pattern.Ref.Crdt(),
      description: 'CRDT document reference for concept-layout configuration.',
    }),
  },
  {
    $id: 'trait.concept-layout.props',
    title: 'Concept Layout Properties',
    additionalProperties: false,
  },
);

/**
 * Public widened export (JSR-safe: explicit t.TSchema surface).
 */
export const ConceptLayoutPropsSchema: t.TSchema = ConceptLayoutPropsSchemaInternal;
