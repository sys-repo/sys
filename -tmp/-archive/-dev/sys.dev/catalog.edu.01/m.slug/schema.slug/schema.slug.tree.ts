import { SLUG } from '../../m.slug/schema.slug/schema.slug.u.ts';
import { type t, Type as T } from './common.ts';

/**
 * Canonical slug-tree item.
 *
 * Structure
 * - Required: slug (stable tree-local identity/label).
 * - Variant A (Ref-only): slug + ref (and nothing else).
 * - Variant B (Inline):   slug + optional description | traits | data | slugs (no ref).
 *
 * Semantics
 * - Enforced structurally via a union: disallowed combos are rejected by the schema.
 * - Unknown keys are rejected (additionalProperties: false).
 * - All inline field atoms are sourced from core SLUG.* to avoid drift.
 *
 * Examples
 * ```yaml
 *  # Ref-only (A): slug + ref, no other keys
 *  - slug: Intro
 *    ref: crdt:create
 *
 *  # Inline (B): slug + traits/data (no ref)
 *  - slug: Video
 *    traits:
 *      - of: "video-player"
 *        as: "vid"
 *    data:
 *      vid: { src: "intro.mp4", start: 3.2 }
 *
 *  # Inline with nesting (B)
 *  - slug: Section A
 *    slugs:
 *      - slug: Getting Started
 *        ref: crdt:create
 * ```
 */
export const SlugTreeItemSchemaInternal = T.Recursive(
  (Self) =>
    T.Union(
      [
        /**
         * Variant A: Ref-only (slug + ref; no other properties)
         */
        T.Object(
          {
            slug: SLUG.ID, // required
            ref: SLUG.REF, // required
          },
          {
            additionalProperties: false,
            title: 'Slug Tree Item (Ref Only)',
            description: `Reference node: stable tree slug plus an external reference. No other properties allowed.`,
          },
        ),

        /**
         * Variant B: Inline (slug + inline surface; no ref)
         */
        T.Object(
          {
            slug: SLUG.ID, // required

            description: T.Optional(SLUG.DESCRIPTION),
            traits: T.Optional(SLUG.TRAITS),
            data: T.Optional(SLUG.DATA),

            slugs: T.Optional(
              T.Array(Self, {
                title: 'Child Slugs (Nodes)',
                description: 'Optional ordered children for this branch.',
              }),
            ),
          },
          {
            additionalProperties: false,
            title: 'Slug Tree Item (Inline)',
            description: `Inline node: stable tree slug plus optional description/traits/data/slugs. No ref allowed.`,
          },
        ),
      ],
      {
        description: `A node is either a ref-only pointer (slug+ref) or an inline node (slug with inline fields).`,
      },
    ),
  {
    $id: 'trait.slug-tree.item',
    title: 'Slug Tree Item',
    description: `A node in the slug-tree hierarchy: stable slug identity; either a ref-only pointer or an inline node.`,
  },
);

/**
 * Root trait data schema.
 *
 * YAML shape:
 * data:
 *   my-tree:
 *     - slug: Section A
 *       slugs:
 *         - slug: Intro
 *           ref: crdt:create
 *         - slug: Video
 *           traits:
 *             - of: video-player
 *               as: vid
 *           data:
 *             vid: { src: "intro.mp4", start: 3.2 }
 *
 * Top-level value is an array of items (no wrapping object).
 */
export const SlugTreePropsSchemaInternal = T.Array(SlugTreeItemSchemaInternal, {
  $id: 'trait.slug-tree',
  title: 'Slug Tree',
  description: `Ordered list of slug-tree items. Each item has a stable slug and is either ref-only or inline.`,
});

/**
 * Public widened exports (JSR-safe: explicit t.TSchema surface).
 */
export const SlugTreeItemSchema: t.TSchema = SlugTreeItemSchemaInternal;
export const SlugTreePropsSchema: t.TSchema = SlugTreePropsSchemaInternal;
