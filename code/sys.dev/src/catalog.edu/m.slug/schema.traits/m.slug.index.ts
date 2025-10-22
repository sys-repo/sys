import { Type as T } from './common.ts';
import { Pattern } from './u.Pattern.ts';

/**
 * Schema for a single slug-index entry.
 */
export const SlugIndexEntrySchema = T.Object(
  {
    /** Human label for the referenced slug. */
    name: T.Optional(T.String({ minLength: 1 })),

    /** CRDT reference to the slug (URN with optional path). */
    ref: T.String({ title: 'CRDT Slug Reference (URN)', ...Pattern.refCrdt }),
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
    index: T.Array(SlugIndexEntrySchema),
  },
  {
    $id: 'trait.slug-index.props',
    title: 'Slug Index Properties',
    additionalProperties: false,
  },
);
