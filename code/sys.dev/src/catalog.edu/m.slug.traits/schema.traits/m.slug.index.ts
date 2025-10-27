import { Pattern, Type as T } from './common.ts';

/**
 * Schema for a single slug-index entry.
 */
export const SlugIndexEntrySchema = T.Object(
  {
    /** Human label for the referenced slug. */
    name: T.Optional(T.String({ minLength: 1 })),

    /** CRDT reference to the slug (URN with optional path). */
    ref: T.String({
      title: 'Slug Reference (CRDT/URN)',
      ...Pattern.crdtRefPattern(),
    }),
  },
  { additionalProperties: false },
);

/**
 * Schema for slug-index: a list of named references to other slugs.
 */
export const SlugIndexPropsSchema = T.Object(
  {
    /** Display name (optional, non-empty if provided). */
    name: T.Optional(T.String({ minLength: 1 })),

    /** Top level summary. */
    description: T.Optional(T.String()),

    /** Array of slug references. */
    slugs: T.Array(SlugIndexEntrySchema),
  },
  {
    $id: 'trait.slug-index.props',
    title: 'Slug Index Properties',
    additionalProperties: false,
  },
);
