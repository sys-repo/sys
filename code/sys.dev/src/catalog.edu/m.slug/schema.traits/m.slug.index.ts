import { Type as T } from './common.ts';
import { Pattern } from './u.Pattern.ts';

/**
 * Properties: Slug Index.
 * - `index`: array of entries pointing at other slugs via CRDT refs.
 *   Each item: { ref: "crdt:<id>/[optional/path]", name?: string }
 */
export const SlugIndexPropsSchema = T.Object(
  {
    /** Display name (optional, non-empty if provided). */
    name: T.Optional(T.String({ minLength: 1 })),

    /** Top level summary. */
    description: T.Optional(T.String()),

    /** Array of slug references. */
    index: T.Array(
      T.Object(
        {
          /** Human label for the referenced slug. */
          name: T.Optional(T.String({ minLength: 1 })),

          /** CRDT reference to the slug (URN with optional path). */
          ref: T.String({
            title: 'CRDT Slug Reference (URN)',
            ...Pattern.refCrdt,
          }),
        },
        { additionalProperties: false },
      ),
    ),
  },
  {
    $id: 'trait.slug-index.props',
    title: 'Slug Index Properties',
    additionalProperties: false,
  },
);
