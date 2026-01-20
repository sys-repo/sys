import type { t } from '../common.ts';
import { Type } from '../common.ts';

const SlugId = Type.String({
  minLength: 1,
  description: 'Stable slug-tree identifier.',
});
const Description = Type.String({
  description: 'Optional human-readable summary.',
});
const Ref = Type.String({
  minLength: 1,
  description: 'Reference target (URN/CRDT).',
});
const TraitBinding = Type.Object(
  {
    of: Type.String({ description: 'Trait id to bind.' }),
    as: Type.String({ description: 'Local alias for trait data.' }),
  },
  { additionalProperties: false },
);
const InlineData = Type.Record(Type.String(), Type.Unknown(), {
  description: 'Alias-keyed trait data for inline slug nodes.',
});

const SlugTreeItemSchemaInternal = Type.Recursive((Self) =>
  Type.Union(
    [
      Type.Object(
        {
          slug: SlugId,
          ref: Ref,
          slugs: Type.Optional(
            Type.Array(Self, { description: 'Nested slug-tree children for this branch.' }),
          ),
        },
        {
          additionalProperties: false,
          description: 'Ref slug-tree node (slug + ref) that may have nested children.',
          title: 'Slug Tree Item (Ref Node)',
        },
      ),
      Type.Object(
        {
          slug: SlugId,
          description: Type.Optional(Description),
          traits: Type.Optional(Type.Array(TraitBinding)),
          data: Type.Optional(InlineData),
          slugs: Type.Optional(
            Type.Array(Self, {
              description: 'Nested slug-tree children for this branch.',
            }),
          ),
        },
        {
          additionalProperties: false,
          description: 'Inline slug-tree node with optional traits/data/children.',
          title: 'Slug Tree Item (Inline)',
        },
      ),
    ],
    {
      description: 'A slug-tree item is either a ref-only pointer or an inline node.',
    },
  ),
);

const SlugTreePropsSchemaInternal = Type.Array(SlugTreeItemSchemaInternal, {
  description: 'Top-level slug-tree array used by the slug-tree trait.',
  title: 'Slug Tree',
});

export const SlugTreeItemSchema: t.TSchema = SlugTreeItemSchemaInternal;
export const SlugTreePropsSchema: t.TSchema = SlugTreePropsSchemaInternal;
